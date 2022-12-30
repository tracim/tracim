import re
import threading
import time
import typing

from easy_profile import SessionProfiler
from hapic.ext.pyramid import PyramidContext
from prometheus_client import Summary
from prometheus_client import make_wsgi_app
import psutil
from pyramid.config import Configurator
from pyramid.wsgi import wsgiapp2

from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.request import TracimRequest


class MonitoringTracimRequest(TracimRequest):
    REQUEST_LATENCY = Summary(
        "http_request_latency_seconds", "Latency of HTTP request", ("method", "path")
    )
    REQUEST_CPU_TIME = Summary(
        "http_request_cpu_time_seconds", "CPU time of HTTP request", ("method", "path")
    )
    REQUEST_DB_TIME = Summary(
        "http_request_db_time_seconds", "DB time of HTTP request", ("method", "path")
    )

    def __init__(
        self, environ, charset=None, unicode_errors=None, decode_param_names=None, **kw
    ) -> None:
        super().__init__(environ, charset, unicode_errors, decode_param_names, **kw)
        self._start_time = time.monotonic()
        self._start_thread_stats = self._get_thread_stats()
        self._session_profiler = SessionProfiler()
        self._session_profiler.begin()
        self.add_finished_callback(self._report_duration)

    def _get_thread_stats(self) -> typing.Tuple[int, float, float]:
        return next(
            thread
            for thread in psutil.Process().threads()
            if thread.id == threading.current_thread().native_id
        )

    def _report_duration(self, _) -> None:
        self._session_profiler.commit()
        duration = max(time.monotonic() - self._start_time, 0)
        path_category = re.sub(r"\\/\d+(\\/|$)", "/*$1", self.path)
        end_thread_stats = self._get_thread_stats()
        total_cpu_time = (
            end_thread_stats.user_time
            - self._start_thread_stats.user_time
            + end_thread_stats.system_time
            - self._start_thread_stats.system_time
        )
        db_duration = self._session_profiler.stats["duration"]
        self.REQUEST_LATENCY.labels(path=path_category, method=self.method).observe(duration)
        self.REQUEST_CPU_TIME.labels(path=path_category, method=self.method).observe(total_cpu_time)
        self.REQUEST_DB_TIME.labels(path=path_category, method=self.method).observe(db_duration)


class PrometheusMetricsApp(TracimApplication):
    def load_content_types(self) -> None:
        pass

    def load_config(self, app_config: CFG) -> None:
        pass

    def check_config(self, app_config: CFG):
        pass

    def load_controllers(
        self,
        configurator: Configurator,
        app_config: CFG,
        route_prefix: str,
        context: PyramidContext,
    ) -> None:
        # Use our request class which enables monitoring of total, CPU and db time per request
        configurator.set_request_factory(MonitoringTracimRequest)
        # Expose prometheus metrics
        metrics_view = wsgiapp2(make_wsgi_app())
        configurator.add_route("metrics", f"{route_prefix}metrics", request_method="GET")
        configurator.add_view(metrics_view, route_name="metrics")


def create_app() -> TracimApplication:
    return PrometheusMetricsApp(
        label="Prometheus metrics",
        slug="prometheus-metrics",
        fa_icon="",
        config={},
        main_route="/metrics",
    )

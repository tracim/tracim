import enum
from http import HTTPStatus
import re
import threading
import time
import typing

from easy_profile import SessionProfiler
from hapic.ext.pyramid import PyramidContext
import marshmallow
from prometheus_client import Summary
from prometheus_client import make_wsgi_app
import psutil
from pyramid.config import Configurator
from pyramid.wsgi import wsgiapp2

from tracim_backend.config import CFG
from tracim_backend.extensions import hapic
from tracim_backend.lib.utils.app import TracimApplication
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import is_user
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.views.core_api.schemas import EnumField
from tracim_backend.views.core_api.schemas import NoContentSchema

SWAGGER_TAG__METRICS_ENDPOINTS = "Metrics"

PATH_CATEGORY_RE = re.compile("\\/\d+(\\/|$)")
PATH_CATEGORY_SUB = "/*\g<1>"


class FrontendMetricNames(str, enum.Enum):
    IRRE = "irre"


class FrontendMetricSchema(marshmallow.Schema):
    name = EnumField(FrontendMetricNames)
    labels = marshmallow.fields.List(marshmallow.fields.String())
    value = marshmallow.fields.Float()


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
        path_category = re.sub(PATH_CATEGORY_RE, PATH_CATEGORY_SUB, self.path)
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

    FRONTEND_METRICS = {
        FrontendMetricNames.IRRE: Summary(
            "frontend_irre_seconds", "IRRE of each frontend page", ("page", )
        )
    }

    def load_content_types(self) -> None:
        pass

    def load_config(self, app_config: CFG) -> None:
        pass

    def check_config(self, app_config: CFG):
        pass

    @hapic.with_api_doc(tags=[SWAGGER_TAG__METRICS_ENDPOINTS])
    @check_right(is_user)
    @hapic.input_body(FrontendMetricSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def add_frontend_metric(self, context, request: TracimRequest, hapic_data=None):
        metric = self.FRONTEND_METRICS[hapic_data.body["name"]]
        # TODO - SGD - 2022-12-30 - configure labels to perform replacement on paths only
        labels = [
            re.sub(PATH_CATEGORY_RE, PATH_CATEGORY_SUB, label)
            for label in hapic_data.body["labels"]
        ]
        # TODO - SGD - 2022-12-30 - support other metric types (Gauge, Counter, Histogram)
        metric.labels(*labels).observe(hapic_data.body["value"])

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
        metrics_view = hapic.with_api_doc(tags=[SWAGGER_TAG__METRICS_ENDPOINTS])(
            wsgiapp2(make_wsgi_app())
        )
        configurator.add_route("get_metrics", f"{route_prefix}metrics", request_method="GET")
        configurator.add_view(metrics_view, route_name="get_metrics")

        # Route for frontend metrics collection
        configurator.add_route("post_metrics", f"{route_prefix}metrics", request_method="POST")
        configurator.add_view(self.add_frontend_metric, route_name="post_metrics")


def create_app() -> TracimApplication:
    return PrometheusMetricsApp(
        label="Prometheus metrics",
        slug="prometheus-metrics",
        fa_icon="",
        config={},
        main_route="/api/metrics",
    )

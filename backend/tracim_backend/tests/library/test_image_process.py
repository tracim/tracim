from io import BytesIO

from PIL import Image
import pytest

from tracim_backend.lib.utils.image_process import ImageRatio
from tracim_backend.lib.utils.image_process import crop_image
from tracim_backend.tests.utils import create_png_test_image


class TestImageProcess(object):
    @pytest.mark.parametrize(
        "original_size, destination_size, ratio",
        [
            # original_size, destination_size, ratio
            # same ration
            ((300, 100), (300, 100), (3, 1)),
            ((600, 100), (600, 100), (6, 1)),
            ((100, 800), (100, 800), (1, 8)),
            ((100, 800), (100, 800), (2, 16)),
            ((256, 256), (256, 256), (1, 1)),
            # bigger original ratio
            ((300, 100), (200, 100), (2, 1)),
            ((600, 100), (300, 100), (3, 1)),
            ((50, 10), (2, 10), (1, 5)),
            # lower original ratio
            ((100, 100), (100, 50), (2, 1)),
            ((100, 100), (100, 33), (3, 1)),
            # edge cases
            ((100, 1), (1, 1), (1, 100)),
        ],
    )
    def test__crop_image__nominal_case(self, original_size, destination_size, ratio):
        dest_image = BytesIO()
        original_image = create_png_test_image(*original_size)
        ratio = ImageRatio(*ratio)
        crop_image(original_image, dest_image, ratio=ratio)
        img = Image.open(dest_image)
        assert destination_size == img.size

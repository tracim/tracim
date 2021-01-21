from fractions import Fraction
import typing

from PIL import Image
from PIL import ImageOps


class ImageRatio:
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height

    def ratio(self) -> Fraction:
        return Fraction(self.width, self.height)

    def sized_to_ratio(self, image_size: "ImageSize") -> "ImageSize":
        width = image_size.width
        height = image_size.height
        if image_size.ratio() == self.ratio():
            pass
        elif image_size.ratio() > self.ratio():
            # INFO - G.M - 2021-01-21 - we do not allow new width to be
            # bigger than previous one,
            # in that specific edge case, we do not render proper ratio.
            width = min(int(self.ratio() * height), width)
        else:
            # INFO - G.M - 2021-01-21 - we do not allow new height to be
            # bigger than previous one,
            # in that specific edge case, we do not render proper ratio.
            height = min(int(Fraction(height, self.ratio())), height)

        # INFO - G.M - 2021-01-21 - if we get 0 width or height,
        # we should adjust to 1 to avoid error.
        width = max(width, 1)
        height = max(height, 1)
        return ImageSize(width, height)


class ImageSize(ImageRatio):
    pass


def crop_image(
    source_file: typing.BinaryIO, destination_file: typing.BinaryIO, ratio: ImageRatio, format="png"
) -> None:
    """
    Crop Image according to ratio.
    result will be stored into destination_file(fileobj)
    """
    img = Image.open(source_file)
    size = ImageSize(*img.size)
    new_size = ratio.sized_to_ratio(size)
    # TODO - G.M - 2021-01-21 - Allow to choose which part of the image
    # to crop, by default, this will center cropped image.
    img = ImageOps.fit(img, (new_size.width, new_size.height))
    img.save(destination_file, format=format)
    destination_file.seek(0)

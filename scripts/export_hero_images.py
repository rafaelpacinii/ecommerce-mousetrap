#!/usr/bin/env python3
"""Export responsive hero WebP assets using Linux GdkPixbuf and libwebp.

Usage: python3 scripts/export_hero_images.py [1 2 3 4]
Original JPEG files are never modified. No Python packages are required.
"""
import ctypes as c
from ctypes.util import find_library
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def bind(library, name, result, *arguments):
    function = getattr(library, name)
    function.restype = result
    function.argtypes = arguments
    return function


def export(numbers):
    libraries = [find_library(name) for name in ('gdk_pixbuf-2.0', 'gobject-2.0', 'webp')]
    if not all(libraries):
        raise SystemExit('Install the GdkPixbuf, GObject and libwebp runtime libraries first.')
    pixbuf, objects, webp = [c.CDLL(name) for name in libraries]
    load = bind(pixbuf, 'gdk_pixbuf_new_from_file_at_scale', c.c_void_p,
                c.c_char_p, c.c_int, c.c_int, c.c_int, c.c_void_p)
    width = bind(pixbuf, 'gdk_pixbuf_get_width', c.c_int, c.c_void_p)
    height = bind(pixbuf, 'gdk_pixbuf_get_height', c.c_int, c.c_void_p)
    stride = bind(pixbuf, 'gdk_pixbuf_get_rowstride', c.c_int, c.c_void_p)
    pixels = bind(pixbuf, 'gdk_pixbuf_get_pixels', c.c_void_p, c.c_void_p)
    encode = bind(webp, 'WebPEncodeRGB', c.c_size_t, c.c_void_p, c.c_int,
                  c.c_int, c.c_int, c.c_float, c.POINTER(c.c_void_p))
    free = bind(webp, 'WebPFree', None, c.c_void_p)
    unref = bind(objects, 'g_object_unref', None, c.c_void_p)
    output = ROOT / 'web/public/images'
    output.mkdir(exist_ok=True)
    for number in numbers:
        source = ROOT / 'web/public' / ('Hero.jpg' if number == 1 else f'Hero{number}.jpg')
        name = 'hero' if number == 1 else f'hero-{number}'
        for size in (768, 1440, 2400):
            image = load(str(source).encode(), size, -1, 1, None)
            if not image:
                raise ValueError(f'Cannot load {source.name}')
            destination = c.c_void_p()
            try:
                count = encode(pixels(image), width(image), height(image), stride(image),
                               84, c.byref(destination))
                if not count:
                    raise ValueError(f'Cannot encode {source.name}')
                target = output / f'{name}-{size}.webp'
                target.write_bytes(c.string_at(destination, count))
                print(f'{target.relative_to(ROOT)}: {width(image)}x{height(image)}, {count} bytes')
            finally:
                if destination:
                    free(destination)
                unref(image)


if __name__ == '__main__':
    numbers = list(map(int, sys.argv[1:])) if len(sys.argv) > 1 else [1, 2, 3, 4]
    if not numbers or any(number not in (1, 2, 3, 4) for number in numbers):
        raise SystemExit('Select hero numbers 1, 2, 3 or 4.')
    export(numbers)

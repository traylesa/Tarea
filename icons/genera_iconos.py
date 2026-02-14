"""
Generador de iconos para extensión Chrome PruebaInicializa4.

Diseño: Rayo estilizado sobre fondo degradado azul-violeta.
- Alto contraste para visibilidad en explorador
- Formas simples que escalan bien a 16px
- Bordes redondeados (estándar Chrome extensions)
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

SIZES = [16, 32, 48, 128]
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Paleta
BG_TOP = (66, 99, 235)       # Azul vibrante
BG_BOTTOM = (139, 92, 246)   # Violeta
SYMBOL_COLOR = (255, 255, 255)
SHADOW_COLOR = (30, 40, 100, 80)


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def draw_rounded_rect(draw, bbox, radius, fill):
    x0, y0, x1, y1 = bbox
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2 * radius, y0 + 2 * radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * radius, y0, x1, y0 + 2 * radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * radius, x0 + 2 * radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * radius, y1 - 2 * radius, x1, y1], 0, 90, fill=fill)


def draw_bolt(draw, cx, cy, size, color, thickness=None):
    """Rayo estilizado - visible incluso a 16px."""
    s = size
    if not thickness:
        thickness = max(1, int(s * 0.12))

    points = [
        (cx - s * 0.18, cy - s * 0.45),  # Punta superior izq
        (cx + s * 0.22, cy - s * 0.45),  # Punta superior der
        (cx + s * 0.05, cy - s * 0.05),  # Quiebre medio der
        (cx + s * 0.25, cy - s * 0.05),  # Brazo medio der
        (cx - s * 0.05, cy + s * 0.45),  # Punta inferior
        (cx - s * 0.05, cy + s * 0.08),  # Quiebre medio izq
        (cx - s * 0.25, cy + s * 0.08),  # Brazo medio izq
    ]

    draw.polygon(points, fill=color)


def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = max(2, int(size * 0.18))

    # Fondo degradado con bordes redondeados
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    draw_rounded_rect(mask_draw, [0, 0, size - 1, size - 1], radius, 255)

    gradient = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    for y in range(size):
        t = y / max(1, size - 1)
        color = lerp_color(BG_TOP, BG_BOTTOM, t)
        for x in range(size):
            gradient.putpixel((x, y), (*color, 255))

    gradient.putalpha(mask)
    img = Image.alpha_composite(img, gradient)
    draw = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2

    # Sombra sutil del rayo (solo en tamaños grandes)
    if size >= 48:
        offset = max(1, int(size * 0.02))
        draw_bolt(draw, cx + offset, cy + offset, size * 0.42, SHADOW_COLOR)

    # Rayo principal
    draw_bolt(draw, cx, cy, size * 0.42, SYMBOL_COLOR)

    # Borde sutil brillante (solo >= 32px)
    if size >= 32:
        border_mask = Image.new('L', (size, size), 0)
        border_draw = ImageDraw.Draw(border_mask)
        draw_rounded_rect(border_draw, [0, 0, size - 1, size - 1], radius, 40)
        draw_rounded_rect(border_draw, [1, 1, size - 2, size - 2], max(1, radius - 1), 0)
        border_layer = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        for y in range(size):
            for x in range(size):
                a = border_mask.getpixel((x, y))
                if a > 0:
                    border_layer.putpixel((x, y), (255, 255, 255, a))
        img = Image.alpha_composite(img, border_layer)

    return img


def main():
    for size in SIZES:
        icon = create_icon(size)
        path = os.path.join(OUTPUT_DIR, f"icon{size}.png")
        icon.save(path, 'PNG')
        print(f"  ✓ icon{size}.png ({size}x{size}px)")

    print(f"\n✅ {len(SIZES)} iconos generados en: {OUTPUT_DIR}")


if __name__ == '__main__':
    main()

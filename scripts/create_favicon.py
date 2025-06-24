#!/usr/bin/env python3
"""
Create a binary dots favicon with a 2x2 square pattern.
"""

from PIL import Image, ImageDraw

def create_binary_dots_favicon(size=32, dot_color=(0, 0, 0), bg_color=(255, 255, 255)):
    """Create a 2x2 binary dots favicon."""
    # Create base image
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Calculate dot positions and sizes
    margin = size // 8  # Margin around edges
    spacing = size // 8  # Space between dots
    dot_size = (size - 2 * margin - spacing) // 2
    
    # 2x2 pattern: filled, empty, empty, filled (diagonal pattern)
    # Top-left: filled
    # Top-right: empty  
    # Bottom-left: empty
    # Bottom-right: filled
    pattern = [
        (True, False),   # Top row
        (False, True)    # Bottom row
    ]
    
    # Draw dots
    for row in range(2):
        for col in range(2):
            if pattern[row][col]:
                x = margin + col * (dot_size + spacing)
                y = margin + row * (dot_size + spacing)
                
                # Draw filled circle
                draw.ellipse([x, y, x + dot_size, y + dot_size], 
                           fill=dot_color, outline=dot_color)
    
    return img

def create_favicon_set():
    """Create multiple favicon sizes."""
    sizes = [16, 32, 48, 64, 128, 256]
    
    # Create favicons with different patterns
    patterns = [
        # Diagonal pattern (main)
        {'name': 'diagonal', 'pattern': [(True, False), (False, True)]},
        # All filled
        {'name': 'all_filled', 'pattern': [(True, True), (True, True)]},
        # Checkerboard
        {'name': 'checkerboard', 'pattern': [(True, False), (False, True)]},
        # Inverse diagonal
        {'name': 'inverse', 'pattern': [(False, True), (True, False)]},
    ]
    
    for pattern_info in patterns:
        for size in sizes:
            # Create base image
            img = Image.new('RGBA', (size, size), (255, 255, 255, 0))  # Transparent background
            draw = ImageDraw.Draw(img)
            
            # Calculate dot positions and sizes
            margin = max(2, size // 8)
            spacing = max(2, size // 8)
            dot_size = (size - 2 * margin - spacing) // 2
            
            pattern = pattern_info['pattern']
            
            # Draw dots with anti-aliasing for larger sizes
            for row in range(2):
                for col in range(2):
                    if pattern[row][col]:
                        x = margin + col * (dot_size + spacing)
                        y = margin + row * (dot_size + spacing)
                        
                        if size >= 32:
                            # For larger sizes, use supersampling for smoother circles
                            scale = 4
                            large_img = Image.new('RGBA', (size * scale, size * scale), (255, 255, 255, 0))
                            large_draw = ImageDraw.Draw(large_img)
                            
                            large_x = x * scale
                            large_y = y * scale
                            large_dot = dot_size * scale
                            
                            large_draw.ellipse([large_x, large_y, large_x + large_dot, large_y + large_dot],
                                             fill=(0, 0, 0, 255))
                            
                            # Downsample
                            img.paste(large_img.resize((size, size), Image.Resampling.LANCZOS), (0, 0))
                            draw = ImageDraw.Draw(img)  # Recreate draw object
                        else:
                            # For small sizes, draw directly
                            draw.ellipse([x, y, x + dot_size, y + dot_size],
                                       fill=(0, 0, 0, 255))
            
            # Save individual size
            filename = f"/home/vasek/problens-web/public/favicon_{pattern_info['name']}_{size}x{size}.png"
            img.save(filename, 'PNG')
            print(f"Created: {filename}")
    
    # Create the main favicon.ico with multiple sizes
    main_pattern_images = []
    for size in [16, 32, 48]:
        img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        
        margin = max(2, size // 8)
        spacing = max(2, size // 8)
        dot_size = (size - 2 * margin - spacing) // 2
        
        # Diagonal pattern for main favicon
        pattern = [(True, False), (False, True)]
        
        for row in range(2):
            for col in range(2):
                if pattern[row][col]:
                    x = margin + col * (dot_size + spacing)
                    y = margin + row * (dot_size + spacing)
                    draw.ellipse([x, y, x + dot_size, y + dot_size],
                               fill=(0, 0, 0, 255))
        
        main_pattern_images.append(img)
    
    # Save as .ico file
    main_pattern_images[0].save(
        '/home/vasek/problens-web/public/favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("Created: /home/vasek/problens-web/public/favicon.ico")

if __name__ == "__main__":
    print("Creating binary dots favicon set...")
    create_favicon_set()
    print("\nDone! Favicon files created in /home/vasek/problens-web/public/")
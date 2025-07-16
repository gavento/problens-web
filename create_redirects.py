#!/usr/bin/env python3
import os
import shutil

def create_redirect_for_path(path, new_base_url="https://bayesbitsbrains.github.io/"):
    """Create a redirect HTML file for a specific path"""
    # Calculate the relative path from the current location
    if path == "/":
        redirect_url = new_base_url
        page_title = "Home"
    else:
        # Remove leading slash and ensure trailing slash
        clean_path = path.strip('/')
        redirect_url = f"{new_base_url}{clean_path}/"
        page_title = clean_path.replace('-', ' ').title()
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url={redirect_url}">
    <link rel="canonical" href="{redirect_url}">
    <title>Redirecting to {page_title}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            margin-bottom: 20px;
        }}
        p {{
            color: #666;
            margin-bottom: 20px;
        }}
        .redirect-link {{
            color: #0066cc;
            text-decoration: none;
            font-weight: bold;
        }}
        .redirect-link:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Page Moved</h1>
        <p>This page has moved to a new location.</p>
        <p>You will be automatically redirected to <a href="{redirect_url}" class="redirect-link">{redirect_url}</a> in a few seconds.</p>
        <p>If you are not redirected automatically, please click the link above.</p>
    </div>
    <script>
        // Additional JavaScript redirect as fallback
        setTimeout(function() {{
            window.location.href = "{redirect_url}";
        }}, 3000);
    </script>
</body>
</html>"""

def process_directory(out_dir):
    """Process the out directory and create redirects"""
    if not os.path.exists(out_dir):
        print(f"Directory {out_dir} does not exist")
        return
    
    # First, replace the main index.html
    index_html = os.path.join(out_dir, 'index.html')
    if os.path.exists(index_html):
        with open(index_html, 'w') as f:
            f.write(create_redirect_for_path("/"))
        print(f"Created redirect for index.html")
    
    # Process all subdirectories
    for item in os.listdir(out_dir):
        item_path = os.path.join(out_dir, item)
        if os.path.isdir(item_path):
            # Check if there's an index.html in this directory
            index_file = os.path.join(item_path, 'index.html')
            if os.path.exists(index_file):
                with open(index_file, 'w') as f:
                    f.write(create_redirect_for_path(f"/{item}"))
                print(f"Created redirect for {item}/index.html")
            
            # Also create redirects for any other HTML files in subdirectories
            for subitem in os.listdir(item_path):
                if subitem.endswith('.html') and subitem != 'index.html':
                    subitem_path = os.path.join(item_path, subitem)
                    if os.path.isfile(subitem_path):
                        # For non-index HTML files, redirect to the directory
                        with open(subitem_path, 'w') as f:
                            f.write(create_redirect_for_path(f"/{item}"))
                        print(f"Created redirect for {item}/{subitem}")

if __name__ == "__main__":
    out_directory = "out"
    process_directory(out_directory)
    print("Redirect creation complete!")
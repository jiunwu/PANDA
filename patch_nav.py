import sys

nav_file = "src/components/Nav.js"

with open(nav_file, 'r') as f:
    content = f.read()

if "Network" not in content and "/network" not in content:
    content = content.replace(
        "{ href: '/data-room', label: 'Data Room' },",
        "{ href: '/data-room', label: 'Data Room' },\n  { href: '/network', label: 'Network' },"
    )
    with open(nav_file, 'w') as f:
        f.write(content)
    print("Nav updated.")
else:
    print("Network already in Nav.")

#!/bin/bash
jq -c '.[]' data/springs.json | while read -r spring; do
    name=$(echo "$spring" | jq -r '.name')
    slug=$(echo "$spring" | jq -r '.slug')
    temp_f=$(echo "$spring" | jq -r '.temp_f')
    fee=$(echo "$spring" | jq -r '.fee')
    gps=$(echo "$spring" | jq -r '.gps')
    description=$(echo "$spring" | jq -r '.description')
    
    cat > "content/springs/${slug}.md" << EOF
---
title: "${name} Hot Springs"
name: "${name}"
temp_f: ${temp_f}
fee: ${fee}
gps: "${gps}"
description: "${description}"
type: springs
---

# ${name} Hot Springs

${description}

**Temperature:** ${temp_f}°F  
**Fee:** \$${fee}  
**GPS:** ${gps}
EOF
done
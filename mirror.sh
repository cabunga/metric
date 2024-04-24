#!/bin/bash
git remote add repo1 https://cabunga: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@github.com/cabunga/metric.git
# Obtener la lista de todos los branches (locales y remotos)
# Recorre todos los branches locales y remotos
for branch in $(git branch -a | grep -vE "remotes/origin/HEAD|remotes/origin/main" | sed 's|remotes/origin/||'); do
    # Extrae el nombre del branch remoto
    remote_branch=$(echo "$branch" | sed 's|remotes/origin/||')
    
    # Verifica si el branch ya existe localmente
    if git show-ref --verify --quiet "refs/heads/$remote_branch"; then
        # Si el branch existe localmente, se cambia a él
        git checkout "$remote_branch"
    else
        # Si el branch no existe localmente, se crea a partir del remoto
        git checkout -b "$remote_branch" "origin/$remote_branch"
    fi
    
    # Empuja los cambios al branch
    git push origin "$remote_branch"
done

echo "¡Todos los branches han sido empujados exitosamente!"


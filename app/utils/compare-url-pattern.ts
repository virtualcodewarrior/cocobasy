function comparePart(first: string, second: string) {
    const isVar = (nameOrVar: string) => /^:.*$/.test(nameOrVar);
    const isFullWildCard = (nameOrVar: string) => nameOrVar.length === 0 || /^\*$/.test(nameOrVar);
    const isPartWildCard = (nameOrVar: string) => !isFullWildCard(nameOrVar) && /[*?]+/.test(nameOrVar);
    const isFixed = (nameOrVar: string) => nameOrVar.length && !isVar(nameOrVar) && !isPartWildCard(nameOrVar) && !isFullWildCard(nameOrVar);

    // ordering is:
    // isFixed > isVar > isPartWildCard > isFullWildCard.
    const firstNum = isFixed(first) ? 4 : isVar(first) ? 3 : isPartWildCard(first) ? 2 : isFullWildCard(first) ? 1 : 0;
    const secondNum = isFixed(second) ? 4 : isVar(second) ? 3 : isPartWildCard(second) ? 2 : isFullWildCard(second) ? 1 : 0;

    return (firstNum < secondNum) ? 1 : (firstNum == secondNum) ? first.localeCompare(second) : -1;
}

// Utility method to compare two part lists.
function compareParts(first: string[], second: string[]) {
    let result = 0;
    let index = 0;

    for (; index < first.length && index < second.length; ++index) {
        result = comparePart(first[index], second[index]);
        if (result) {
            break;
        }
    }
    if (!result) {
        if (index == first.length && index != second.length) {
            result = comparePart('', second[index]);
        } else if (index != first.length && index == second.length) {
            result = comparePart(first[index], '');
        }
    }

    return result;
}

export function compareUrlPattern(first: URLPattern, second: URLPattern) {
    let result = 0;
    if (first.pathname || second.pathname) {
        if (first.pathname && !second.pathname) {
            result = compareParts(first.pathname.split('/'), []);
        } else if (!first.pathname && second.pathname) {
            result = compareParts([], second.pathname.split('/'));
        } else {
            result = compareParts(first.pathname.split('/'), second.pathname.split('/'));
        }
    }

    return result;
}

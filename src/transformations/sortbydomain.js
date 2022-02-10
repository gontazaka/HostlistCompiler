const _ = require('lodash');
const consola = require('consola');
const ruleUtils = require('../rule');
const publicSuffixList = require('publicSuffixList');

/**
 * 
 * TODO: comment
 *
 * @param {Array<String>} rules - rules to sort by domain name
 * @returns {Array<String>} array of rules
 */
function sortByDomain(rules) {
    if (_.isEmpty(rules)) {
        consola.info('Empty rules array');
        return rules;
    }

    // 0:Empty | 1:Comment | 2:Rule
    const getLineType = function (ruleText) {
        if (_.isEmpty(ruleText)) {
            return 0;
        } else if (ruleUtils.isComment(ruleText)) {
            return 1;
        } else {
            return 2;
        }
    };

    let l = 0;
    let leadPack = { rule: null, other: [] };;
    for (; l < rules.length; l++) {
        const ruleText = rules[l];
        const currentLine = getLineType(ruleText);

        if (currentLine >= 2) {
            // End of Lead-lines
            break;
        }

        leadPack.other.unshift(ruleText);
    }

    let packs = [];
    let pack = null;
    let prevLine = -1;

    for (let i = rules.length - 1; i >= l; i -=1) {
        const ruleText = rules[i];
        const currentLine = getLineType(ruleText);

        if (currentLine > prevLine) {
            if (pack) {
                packs.unshift(pack);
            }

            // found new pack
            switch (currentLine) {
                case 0:
                case 1: // fall-through
                default: // fall-through BUG
                    pack = { rule: null, other: [ruleText] };
                    break;
                case 2:
                    pack = { rule: ruleText, other: [] };
                    break;
            }
        } else {
            if (!pack) {
                prevLine = currentLine
                continue;
            }

            switch (currentLine) {
                case 0:
                case 1: // fall-through
                default: // fall-through BUG
                    pack.other.unshift(ruleText);
                    break;
                case 2: // found new new
                    packs.unshift(pack);
                    pack = { rule: ruleText, other: [] };
                    break;
            }
        }
        prevLine = currentLine
    }
    // last pack
    if (pack) {
        packs.unshift(pack);
    }
    packs.unshift(leadPack);

    const sortNormalizeHn = function (hn) {
        let domain = publicSuffixList.getDomain(hn);
        let normalized = domain || hn;
        if (domain && hn.length !== domain.length) {
            const subdomains = hn.slice(0, hn.length - domain.length - 1);
            normalized += '.' + (
                subdomains.includes('.')
                    ? subdomains.split('.').reverse().join('.')
                    : subdomains
            );
        } else {
            normalized = hn;
        }
        return normalized;
    };

    packs.sort((lhs, rhs) => {
        if (lhs.rule == null || rhs.rule == null) {
            return 0;
        }

        const lhsHostname = ruleUtils.extractHostname(lhs.rule)
        const rhsHostname = ruleUtils.extractHostname(rhs.rule)
        if (lhsHostname == null || rhsHostname == null) {
            return 0;
        }

        const lhsToken = sortNormalizeHn(lhsHostname)
        const rhsToken = sortNormalizeHn(rhsHostname)

        return lhsToken.localeCompare(rhsToken)
    });

    let filtered = []
    for (let i = 0; i < packs.length; i++) {
        const p = packs[i];
        if (p.other.length) {
            filtered = filtered.concat(p.other);
        }
        if (p.rule) {
            filtered.push(p.rule)
        }
    }

    return filtered;
}

module.exports = sortByDomain;

module.exports = {
    votes: {
        yes: 1,
        notSure: 0,
        no: -1,
    },
    ratings: {
        trustedUser: 1,
        averageUser: 0,
        untrustedUser: -1,
    },
    weights: {
        trustedUser: 5,
        averageUser: 2,
        untrustedUser: 1
    },
    multipliers: {
        yes: 2,
        notSure: 1,
        no: -1
    },
    bounds: {
        trustedUser: 50,
        averageUser: 0,
    },
    claimsLimit: 2,
    entriesLimit: 2
};

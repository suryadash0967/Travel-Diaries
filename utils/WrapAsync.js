module.exports = (fn) => {
    return (req, res, next) => {
        // We'll simply call the function that came as the argument and throw any error, if came across.
        Promise.resolve(fn(req, res, next)).catch(err => next(err));
    };
};

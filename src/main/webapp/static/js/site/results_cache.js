/**
 * Created by Jeffrey.Deng on 2018/4/1.
 * 缓存计算结果，或者缓存请求结果
 * 缓存需要定时刷新的话使用PeriodCache
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals
        window.ResultsCache = factory(window.jQuery);
    }
})(function ($) {

    var ResultsCache = function (computationFunction, cacheKeyGenerator) {
        this._cache = {};
        this._computationFunction = computationFunction;
        if (cacheKeyGenerator)
            this._cacheKeyGenerator = cacheKeyGenerator;
    };

    ResultsCache.prototype.compute = function () {
        // try to retrieve computation from cache
        var cacheKey = this._cacheKeyGenerator.apply(this, arguments);
        var promise = this._cache[cacheKey];

        // if not yet cached: start computation and store promise in cache
        if (!promise) {
            var deferred = $.Deferred();
            promise = deferred.promise();
            this._cache[cacheKey] = promise;

            // perform the computation
            var args = Array.prototype.slice.call(arguments);
            args.push(deferred.resolve);
            this._computationFunction.apply(null, args);
        }

        return promise;
    };

    // Default cache key generator (works with Booleans, Strings, Numbers and Dates)
    // You will need to create your own key generator if you work with Arrays.
    ResultsCache.prototype._cacheKeyGenerator = function (args) {
        return Array.prototype.slice.call(arguments).join("|");
    };

    return ResultsCache;
});
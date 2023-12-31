import {CacheService} from "../cache.service";
import {lastValueFrom, firstValueFrom, Observable} from "rxjs";
import {posts} from "./server/posts";
import {observableFunction} from "./utils/observable-function";
import {resetCounterUrl, postsUrl} from "./server/urls";

describe("Cache service rearranging url parameters", () => {
   let cacheService: CacheService;

   beforeEach(async () => {
      observableFunction(resetCounterUrl).subscribe();
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
      });
   });

   it("Accepts query params in the url property.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T"),
            observable: (url) => observableFunction(url),
         })
      );

      expect(cacheService.cachedData).toEqual({
         [postsUrl.concat("?a=T")]: posts,
      });
   });

   it("Accepts query params defaultParams property", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
            defaultParams: {a: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [postsUrl.concat("?a=T")]: posts,
      });
   });

   it("Accepts query params in the params property.", async () => {
      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl,
            observable: (url) => observableFunction(url),
            params: {a: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [postsUrl.concat("?a=T")]: posts,
      });
   });

   it("Sorts the default params, url parameters and params properties keys correctly.", async () => {
      const expectedUrl = postsUrl.concat("?a=T&b=T&g=T&m=T&v=T&z=T");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?g=T&a=T&z=T&"),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
            },
            defaultParams: {m: "T"},
            params: {v: "T", b: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Overwrites the defaultParams keys with url params and params property keys.", async () => {
      const expectedUrl = postsUrl.concat("?a=T&b=T&f=T");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?a=T"),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
            },
            defaultParams: {a: "a", b: "b", f: "T"},
            params: {b: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Removes the null, undefined and empty strings and empty lists in query params.", async () => {
      const expectedUrl = postsUrl.concat("?a=T&f=T");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat('?a=T&c=undefined&d=""&e=&f=T&'),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
            },
            defaultParams: {v: "null"},
            params: {g: "null", i: ""},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Overwrites the url query params with params object if `paramsObjectOverwritesUrlQueries = true`.", async () => {
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
         paramsObjectOverwritesUrlQueries: true,
      });

      const expectedUrl = postsUrl.concat("?page-size=20");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?page-size=10"),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
            },
            params: {"page-size": "20"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("Does NOT overwrite the url query params with params object if `paramsObjectOverwritesUrlQueries = false`.", async () => {
      cacheService = new CacheService({
         isDevMode: false,
         observableConstructor: Observable,
         paramsObjectOverwritesUrlQueries: false,
      });

      const expectedUrl = postsUrl.concat("?page-size=10");

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?page-size=10"),
            observable: (url) => {
               expect(url).toEqual(expectedUrl);
               return observableFunction(url);
            },
            params: {"page-size": "20"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });

   it("it uses the sorted an truncated url to check the cached data", async () => {
      const expectedUrl = postsUrl.concat("?c=T&g=T&z=T");

      await firstValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?z=T&g=T"),
            observable: (url) => observableFunction(url),
            params: {c: "T"},
         })
      );

      await lastValueFrom(
         cacheService.get<Observable<unknown>>({
            url: postsUrl.concat("?m=null&z=T&k=&c=T&"),
            observable: (url) => observableFunction(url),
            params: {f: "undefined", g: "T"},
         })
      );

      expect(cacheService.cachedData).toEqual({
         [expectedUrl]: posts,
      });
   });
});

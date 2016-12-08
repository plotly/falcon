- [x] Parquet files hang sometimes
- [x] postgis instance
- [ ] fail when registering queries
- [ ] whats with that "Can't set headers after request is sent" error message??
- [ ] clean up all of the Logger.log calls - the whitespace that the back tick quotes introduce is real annoying.
- [ ] elasticsearch UI on prod
- [ ] run in a docker container
- [ ] publish architecture
- [ ] fix documentation links

- [ ] start running against prod

little things
- update e2e tests
    - test that server is running (keep majority of api tests in routes.spec.js)
    - test headless mode
- update `updateGrid` in QueryScheduler to remove query if the response was a 404

***

- Tell people about the logs in the UI
- Need to update shareplot and workspace dates to be "date modified" instead of
  date created.

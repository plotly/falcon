This document lists conventions and steps to follow for creating a release.

# Version Number

- Patch version numbers are reserved for OnPrem releases. For example, version
  `2.4.3` corresponds to an OnPrem release based on Falcon `v2.4.0`.

# Release Checklist

- [ ] Create branch `vM.m.p`
- [ ] Update `CHANGELOG.md`
- [ ] Update version number in `package.json`
- [ ] Confirm CircleCI build works
- [ ] Confirm TravisCI build works
- [ ] Confirm AppVeyor build works
- [ ] Confirm Quay build works
- [ ] Confirm Windows installer works and Falcon is able to connect to DB2 and sqlite
- [ ] Confirm Mac installer works and Falcon is able to connect to DB2 and sqlite
- [ ] Do not use Firefox to download the Linux installer from CircleCI ([issue #471](https://github.com/plotly/falcon-sql-client/issues/471))
- [ ] Confirm Linux installer works and Falcon is able to connect to DB2 and sqlite
- [ ] Ensure `yarn build` has been run before manual build
- [ ] Build deb installer manually
- [ ] Confirm deb installer works and Falcon is able to connect to sqlite
- [ ] Build AppImage installer manually
- [ ] Build rpm installer manually
- [ ] Rebase and merge into `master`
- [ ] Tag current `master` as `vM.m.p` and annotate it with the changelog message (this should automatically update the latest release in github)
- [ ] Edit the release to attach all the installers.
- [ ] Check links in https://plot.ly/free-sql-client-download/

## Additional Checklist for an OnPrem Release

- [ ] Create branch `M.m-onprem`
- [ ] Create Quay tag `M.m-onprem` (Visit https://quay.io/repository/plotly/falcon-sql-client?tab=tags , click the gear icon next to the thing you want to tag, then choose “Add new…")

## Additional Checklist for an OnPrem Update

- [ ] Create Quay tag `M.m.p-onprem` (Visit https://quay.io/repository/plotly/falcon-sql-client?tab=tags , click the gear icon next to the thing you want to tag, then choose “Add new…")


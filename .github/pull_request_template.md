<!-- Here, you can write a short summary of what the pull request brings. If a related issue exists, please reference it here -->

## Checkpoints

<!-- These points must be checked before merging. Please don't edit them out. -->

**For developers**

- [ ] If relevant, manual tests have been done to ensure the stability of the whole application and that the involved feature works
- [ ] The original issue is up to date w.r.t the latest discussions and contains a short summary of the implemented solution
- [ ] Automated tests covering the feature or the fix, have been written, deemed irrelevant (give the reason), or an issue has been created to implement the test (give the link)
- [ ] Make sure that:
  - if there are modifications in the Tracim configuration files (eg. `development.ini`), they are documented in `backend/doc/setting.md`
  - any migration process required for existing instances is documented
  - relevant people for these changes are notified
- [ ] Original authors of the features included in a multi-feature branch (maintenance fixes -> develop, security fixes -> develop, …) should be part of the reviewers, especially if you encountered merge conflicts.

**For code reviewers**

- [ ] The code is clear enough
- [ ] If there are FIXMEs in the code, related issues are mentioned in the FIXME
- [ ] If there are TODOs, NOTEs or HACKs in code, the date and the developer initials are present

**For testers**

- [ ] Manual, quality tests have been done

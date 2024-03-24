export const EXPORTED_SYMBOLS = ["WorkspacesExternalFileService"];

export const WorkspacesExternalFileService = {
  get _workspacesStoreFile() {
    return PathUtils.join(
      PathUtils.profileDir,
      "Workspaces",
      "Workspaces.json",
    );
  },
};

pnpm -r exec -- npm version --no-git-tag-version $1
pnpm update -r --workspace --filter='*-example' --save-workspace-protocol=false 'rakkasjs' '@rakkasjs/*'
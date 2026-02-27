# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Admin base route

This project now includes a starter admin form for teachers at `/admin`.

- Route UI: `src/routes/admin/+page.svelte`
- Server action + validation: `src/routes/admin/+page.server.ts`

### What it does now

- Accepts sign metadata (`word`, `book`, `unit`, parameters)
- Supports book selection from: Signing naturally, True Way ASL, MISCELLANEOUS
- Accepts a GIF upload (`image/gif` only)
- Validates all required fields server-side
- Returns a success message and payload preview

### MySQL handoff point

Inside `src/routes/admin/+page.server.ts`, use the `submission` object in the action to insert into MySQL.

Example shape currently available:

- `word`
- `book`
- `unit`
- `handshape`
- `location`
- `movement`
- `palmOrientation`
- `nonManualSignals`
- `gifFileName`
- `gifSize`
- `submittedAt`
import {
  createRouter,
  createHashHistory,
  createRootRoute,
  createRoute,
  Outlet,
} from '@tanstack/react-router';
import { WorkspaceListPage } from '../../ui/pages/WorkspaceListPage';
import { WorkspacePage } from '../../ui/pages/WorkspacePage';
import { BurndownPage } from '../../ui/pages/BurndownPage';
import { SharePage } from '../../ui/pages/SharePage';
import { NotFoundPage } from '../../ui/pages/NotFoundPage';

const hashHistory = createHashHistory();

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => <NotFoundPage />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: WorkspaceListPage,
});

const workspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspace/$wid',
  component: WorkspacePage,
});

const burndownRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspace/$wid/burndown/$bid',
  component: BurndownPage,
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share',
  component: SharePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  workspaceRoute,
  burndownRoute,
  shareRoute,
]);

export const router = createRouter({
  routeTree,
  history: hashHistory,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

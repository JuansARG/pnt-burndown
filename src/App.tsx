import './ui/design-system/tokens.css';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './infrastructure/router/index';
import { migrateLegacySprint } from './infrastructure/storage/migrateLegacySprint';

// Run one-time migration before router mounts
migrateLegacySprint();

function App() {
  return <RouterProvider router={router} />;
}

export default App;

import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index('routes/root/index.tsx'), // Root redirect to sign-in
    route('sign-in', 'routes/root/sign-in.tsx'),
    route('api/create-trip', 'routes/api/create-trip.ts'),
    layout('routes/admin/admin-layout.tsx', [
        route('dashboard', 'routes/admin/dashboard.tsx'),
        route('all-users', 'routes/admin/all-users.tsx'),
        route('trips', 'routes/admin/trips.tsx'),
        route('trips/create', 'routes/admin/create-trip.tsx'),
        route('trips/:tripId', 'routes/admin/trip-detail.tsx'),
    ]),
    layout('routes/root/page-layout.tsx', [
        route('travel', 'routes/root/travel-page.tsx')
    ])
] satisfies RouteConfig;
import { useEffect } from 'react';
import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/react';
import { esMX } from '@clerk/localizations';

// Botones y enlaces de Clerk con el naranja de la marca (brand-500)
const APPEARANCE = { variables: { colorPrimary: '#f97316', borderRadius: '0.75rem' } };

// Los formularios de Clerk (inicio de sesión, registro, perfil) se abren como
// ventanas modales, así que no hace falta montar componentes suyos en la página.
function Sync({ onChange }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  useEffect(() => {
    onChange({
      provider: 'clerk',
      loaded: isLoaded,
      signedIn: Boolean(isSignedIn && user),
      user:
        isSignedIn && user
          ? {
              id: user.id,
              name: user.fullName ?? user.firstName ?? '',
              email: user.primaryEmailAddress?.emailAddress ?? null,
              imageUrl: user.imageUrl,
              role: user.publicMetadata?.role ?? null,
            }
          : null,
      getToken: () => getToken(),
      signIn: () => clerk.openSignIn(),
      signOut: () => signOut(),
      openProfile: () => clerk.openUserProfile(),
    });
  }, [isLoaded, isSignedIn, user, getToken, signOut, clerk, onChange]);

  return null;
}

export default function ClerkSession({ onChange }) {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY} localization={esMX} afterSignOutUrl="/" appearance={APPEARANCE}>
      <Sync onChange={onChange} />
    </ClerkProvider>
  );
}

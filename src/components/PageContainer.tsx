import { Container } from '@mui/material';
import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {children}
    </Container>
  );
}
import { Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "../components/PageContainer";

export function NotFoundPage(){
  const navigate = useNavigate();
  return(<>
  <PageContainer>
  <div style={{ textAlign: 'center', marginTop: '4rem' }}>
    <Typography variant="h3">404</Typography>
    <Typography color="text.secondary" gutterBottom>Page not found</Typography>
    <Button variant="contained" onClick={()=>navigate('/dashboard')}>Back to dashboard</Button>
  </div>
  </PageContainer>
  </>)
}
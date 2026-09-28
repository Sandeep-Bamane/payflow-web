import { Grid } from "@mui/material";
import { PageContainer } from "../components/PageContainer";
import { WalletBalance } from "../features/wallet/WalletBalance";

// Layout only — each card owns its own data via hooks
export function DashboardPage(){
    return (
        <PageContainer>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <WalletBalance />
                </Grid>
            </Grid>
        </PageContainer>
    );
}

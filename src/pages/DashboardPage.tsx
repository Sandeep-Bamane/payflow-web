import { Box, Grid, Typography } from "@mui/material";
import { PageContainer } from "../components/PageContainer";
import { WalletBalance } from "../features/wallet/WalletBalance";
import { TransactionList } from "../features/transactions/TransactionList";
import { StatsCards } from "../features/stats/StatsCards";
import { SendMoneyCard } from "../features/wallet/SendMoneyCard";

// Layout only — each card owns its own data via hooks
export function DashboardPage(){
    return (
        <PageContainer>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 500, mb: 3 }}>
                Dashboard
            </Typography>
            {/* Balance stands alone, full width, above the stats row */}
            <WalletBalance />
            {/* StatsCards lays out its own 2-card row (sm=6 each) */}
            <Box sx={{ mt: 2 }}>
                <StatsCards />
            </Box>
            <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* md=5 transfer form column — recipient-only preview until Unit 4b */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <SendMoneyCard />
                </Grid>
                <Grid size={{ xs: 12, md: 7 }}>
                    <TransactionList />
                </Grid>
            </Grid>
        </PageContainer>
    );
}

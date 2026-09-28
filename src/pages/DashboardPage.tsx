import { Grid } from "@mui/material";
import { PageContainer } from "../components/PageContainer";
import { WalletBalance } from "../features/wallet/WalletBalance";
import { TransactionList } from "../features/transactions/TransactionList";
import { StatsCards } from "../features/stats/StatsCards";
import { SendMoneyCard } from "../features/wallet/SendMoneyCard";

// Layout only — each card owns its own data via hooks
export function DashboardPage(){
    return (
        <PageContainer>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <WalletBalance />
                </Grid>
                {/* StatsCards lays out its own 2 cards (sm=6 each) inside this slot → 3 equal cards across */}
                <Grid size={{ xs: 12, sm: 8 }}>
                    <StatsCards />
                </Grid>
            </Grid>
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

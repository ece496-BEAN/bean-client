import { Stack } from "@mui/material";
import AccountMenu from "./AccountMenu";

interface HeaderBannerProps {
  headerText: string;
  showAccountMenu?: boolean;
}

export const HeaderBanner = ({
  headerText,
  showAccountMenu,
}: HeaderBannerProps) => {
  return (
    <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
      <Stack
        direction="row"
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <h1 className="text-2xl font-bold">{headerText}</h1>

        {showAccountMenu && <AccountMenu />}
      </Stack>
    </header>
  );
};

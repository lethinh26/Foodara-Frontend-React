import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Avatar, Badge, Button, Typography } from "antd";
import {
    LayoutDashboard,
    UtensilsCrossed,
    Package,
    ClipboardList,
    Truck,
    Megaphone,
    Store,
    Star,
    Bell,
    LogOut,
    Menu as MenuIcon,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../hooks/useStore";
import { useWebSocket } from "../hooks/useWebSocket";
import { selectUser, logout } from "../store/authSlice";
import { selectUnreadCount, addNotification } from "../store/notificationSlice";
import { authService } from "../services/authService";
import { merchantService } from "../services/merchantService";
import NotificationPanel from "../components/NotificationPanel";
import type { MerchantOrder } from "../types/merchant";

const { Header, Sider, Content } = Layout;

const menuItems = [
    { key: "/merchant", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    {
        key: "/merchant/orders",
        icon: <ClipboardList size={18} />,
        label: "Đơn hàng",
    },
    { key: "/merchant/handover",
        icon: <Truck size={18} />,
        label: "Giao tài xế",
    },
    {
        key: "/merchant/menu",
        icon: <UtensilsCrossed size={18} />,
        label: "Thực đơn",
    },
    { key: "/merchant/inventory", icon: <Package size={18} />, label: "Tồn kho" },
    {
        key: "/merchant/promotions",
        icon: <Megaphone size={18} />,
        label: "Khuyến mãi",
    },
    { key: "/merchant/reviews", icon: <Star size={18} />, label: "Đánh giá" },
    { key: "/merchant/profile", icon: <Store size={18} />, label: "Hồ sơ đối tác" },
];

export const MerchantLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const unreadCount = useAppSelector(selectUnreadCount);
    const [collapsed, setCollapsed] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [notifOpen, setNotifOpen] = useState(false);

    const selectedKey =
        menuItems
            .map((item) => item.key)
            .filter((key) => location.pathname === key || location.pathname.startsWith(key + "/"))
            .sort((a, b) => b.length - a.length)[0] || "";

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch {}
        dispatch(logout());
        navigate("/merchant/login");
    };

    useEffect(() => {
        merchantService
            .getProfile()
            .then(async (m) => {
                if (m.approvalStatus !== "approved") {
                    navigate("/merchant/register");
                    return;
                }
                try {
                    const stores = await merchantService.getStores();
                    if (stores[0]?.id) setStoreId(stores[0].id);
                } catch {}
            })
            .catch(() => {
                navigate("/merchant/login");
            });
    }, [navigate]);

    useWebSocket<Partial<MerchantOrder>>({
        topic: storeId ? `/topic/merchant.${storeId}.orders` : undefined,
        onMessage: (msg) => {
            if (!msg?.id) return;
            // New order notification handled by Notification Service via /topic/notifications.{userId}
        },
    });

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={260}
                style={{
                    background: "var(--surface)",
                    borderRight: "1px solid var(--border-soft)",
                    position: "fixed",
                    height: "100vh",
                    left: 0,
                    top: 0,
                    zIndex: 200,
                }}
                trigger={null}
            >
                <div
                    style={{
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderBottom: "1px solid var(--border-soft)",
                    }}
                >
                    <img
                        src={collapsed ? "/logo/logo_foodara.png" : "/logo/secondary_logo.png"}
                        alt="Foodara Admin"
                        style={{ height: collapsed ? 36 : 48, transition: "all 0.2s" }}
                    />
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{ borderRight: "none", padding: "8px 0" }}
                />
                <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, padding: "0 16px" }}>
                    <Button
                        type="text"
                        block
                        icon={<LogOut size={16} />}
                        onClick={handleLogout}
                        danger
                        style={{ justifyContent: "flex-start", padding: "0 16px" }}
                    >
                        {!collapsed && "Đăng xuất"}
                    </Button>
                </div>
            </Sider>

            <Layout
                style={{
                    marginLeft: collapsed ? 80 : 260,
                    transition: "margin-left 0.2s",
                }}
            >
                <Header
                    style={{
                        background: "var(--surface)",
                        borderBottom: "1px solid var(--border-soft)",
                        padding: "0 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                        height: 64,
                    }}
                >
                    <Button type="text" icon={<MenuIcon size={20} />} onClick={() => setCollapsed(!collapsed)} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Badge count={unreadCount} size="small">
                            <Button type="text" icon={<Bell size={20} />} onClick={() => setNotifOpen(true)} />
                        </Badge>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Avatar src={user?.avatar} size={32}>
                                {user?.fullName?.[0]}
                            </Avatar>
                            <div>
                                <Typography.Text strong style={{ fontSize: 14, color: "#000000", display: "block" }}>
                                    {user?.fullName || "Merchant"}
                                </Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                                    Quản lý quán
                                </Typography.Text>
                            </div>
                        </div>
                    </div>
                </Header>
                <Content style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
                    <Outlet />
                </Content>

                <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} userIdOverride={storeId ?? undefined} />
            </Layout>
        </Layout>
    );
};

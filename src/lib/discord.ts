const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

export async function sendDiscordMessage(embeds: any[], components: any[] = []) {
    try {
        const response = await fetch(`https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds,
                components: components.length > 0 ? components : undefined
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Discord API Error:', response.status, errorText);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error sending Discord message:', error);
        return false;
    }
}

export async function sendDirectMessage(discordUserId: string, embeds: any[], components: any[] = []) {
    try {
        // Step 1: Open a DM channel with the user
        const dmChannelResponse = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient_id: discordUserId
            }),
        });

        if (!dmChannelResponse.ok) {
            const errorText = await dmChannelResponse.text();
            console.error('Failed to open Discord DM Channel:', dmChannelResponse.status, errorText);
            return false;
        }

        const channelData = await dmChannelResponse.json();
        const dmChannelId = channelData.id;

        // Step 2: Send the message to the generated DM channel ID
        const response = await fetch(`https://discord.com/api/v10/channels/${dmChannelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds,
                components: components.length > 0 ? components : undefined
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Discord DM API Error:', response.status, errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending Discord DM:', error);
        return false;
    }
}

export async function notifyNewUserRegistration(name: string, email: string, ip: string = "Unknown") {
    const embed = {
        title: "🎉 New User Registration!",
        color: 0x00FF00, // Green
        fields: [
            {
                name: "Name",
                value: name,
                inline: true
            },
            {
                name: "Email",
                value: email,
                inline: true
            },
            {
                name: "IP Address",
                value: ip,
                inline: false
            }
        ],
        footer: {
            text: "Codeon Hosting Panel System"
        },
        timestamp: new Date().toISOString()
    };

    return sendDiscordMessage([embed]);
}

export async function notifyAdminLogin(name: string, email: string, ip: string = "Unknown") {
    const embed = {
        title: "🛡️ Admin Login Alert",
        color: 0xFF0000, // Red
        fields: [
            {
                name: "Admin",
                value: `${name} (${email})`,
                inline: false
            },
            {
                name: "IP Address",
                value: ip,
                inline: false
            }
        ],
        footer: {
            text: "Security Monitor"
        },
        timestamp: new Date().toISOString()
    };

    return sendDiscordMessage([embed]);
}

export async function notifyOrderUpdate(orderId: string, planName: string, userName: string, status: string, price: number, receiptImage?: string | null) {
    const embed = {
        title: status === "PENDING" ? "🛒 New Server Order" : "🛰️ Order Status Updated",
        color: status === "APPROVED" ? 0x00FF00 : status === "PENDING" ? 0x0088FF : 0xFF0000,
        fields: [
            {
                name: "Order ID",
                value: orderId,
                inline: true
            },
            {
                name: "Plan",
                value: planName,
                inline: true
            },
            {
                name: "User",
                value: userName,
                inline: true
            },
            {
                name: "Status",
                value: status,
                inline: true
            },
            {
                name: "Price",
                value: `$${price}`,
                inline: true
            }
        ],
        footer: {
            text: "Order Management System"
        },
        timestamp: new Date().toISOString()
    } as any;

    if (receiptImage && status === "PENDING") {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        embed.image = { url: `${baseUrl}${receiptImage}` };
    }

    const components = [];
    if (status === "PENDING") {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        components.push({
            type: 1,
            components: [
                {
                    type: 2,
                    label: "Review Order (Admin Panel)",
                    style: 5,
                    url: `${baseUrl}/admin/orders`
                }
            ]
        });
    }

    return sendDiscordMessage([embed], components);
}

export async function notifyNewTicket(ticketId: string, subject: string, userName: string, userEmail: string, initialMessage: string, appHostUrl: string) {
    const embed = {
        title: "🎫 New Support Ticket",
        color: 0xFFAA00, // Orange
        fields: [
            {
                name: "Ticket Subject",
                value: subject,
                inline: false
            },
            {
                name: "User",
                value: `${userName} (${userEmail})`,
                inline: false
            },
            {
                name: "Message",
                value: initialMessage.length > 1024 ? initialMessage.substring(0, 1020) + "..." : initialMessage,
                inline: false
            }
        ],
        footer: {
            text: `Ticket ID: ${ticketId}`
        },
        timestamp: new Date().toISOString()
    };

    const components = [
        {
            type: 1, // Action Row
            components: [
                {
                    type: 2, // Button
                    style: 5, // URL Button
                    label: "View & Reply Ticket",
                    url: `${appHostUrl}/admin/tickets/${ticketId}`
                }
            ]
        }
    ];

    return sendDiscordMessage([embed], components);
}

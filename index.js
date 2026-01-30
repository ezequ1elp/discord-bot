import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import http from "http";

// --- Servidor HTTP falso para Render ---
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end("OK")).listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en el puerto ${PORT}`);
});

// --- Inicializa el cliente de Discord ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================
// 🔢 CONTADORES POR ROL
// =====================
const COUNTERS = [
  { roleId: "1363457916375662742", channelId: "1466709052808761354" }, // FXCREWS
  { roleId: "1362781885587001487", channelId: "1466709131531386981" }, // FXGIRLS
  { roleId: "1361658561611956345", channelId: "1466709160388460574" }  // FXBOYS
];

async function updateRoleCounters(guild) {
  await guild.members.fetch();

  for (const item of COUNTERS) {
    const role = guild.roles.cache.get(item.roleId);
    const channel = guild.channels.cache.get(item.channelId);
    if (!role || !channel) continue;

    const baseName = channel.name.split(":")[0];
    await channel.setName(`${baseName}: ${role.members.size}`);
  }
}

// =====================
// 🤖 BOT READY
// =====================
client.on("ready", () => {
  console.log(`✅ ${client.user.tag} está ONLINE`);

  const guild = client.guilds.cache.first();
  if (guild) {
    updateRoleCounters(guild);

    // 🔄 Actualiza contadores cada 5 minutos
    setInterval(() => {
      updateRoleCounters(guild);
    }, 5 * 60 * 1000);
  }

  // Ping automático cada hora para mantener la Developer Badge
  const channelId = process.env.PING_CHANNEL_ID;
  setInterval(() => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
      channel.send("💡 Ping automático para mantener la Developer Badge");
      console.log("Ping enviado para mantener la badge");
    }
  }, 60 * 60 * 1000);
});

// =====================
// 👤 NUEVO MIEMBRO
// =====================
client.on("guildMemberAdd", async (member) => {
  // Rol automático FXCREWS
  const roleId = "1363457916375662742";
  const role = member.guild.roles.cache.get(roleId);

  if (role) {
    try {
      await member.roles.add(role);
      console.log(`Rol ${role.name} asignado a ${member.user.tag}`);
    } catch (err) {
      console.error("Error asignando rol:", err);
    }
  }

  updateRoleCounters(member.guild);
});

// =====================
// 👋 MIEMBRO SALE
// =====================
client.on("guildMemberRemove", member => {
  updateRoleCounters(member.guild);
});

// =====================
// 💬 COMANDOS SLASH
// =====================
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "ping") {
      await interaction.reply({ content: "🏓 Pong!", ephemeral: false });
    }
  } catch (err) {
    console.error("Error en interactionCreate:", err);
  }
});

// =====================
// 🔐 LOGIN
// =====================
client.login(process.env.BOT_TOKEN);

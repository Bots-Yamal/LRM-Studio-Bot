const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const { setupAdmin, adminCommands } = require("./admin");

// =====================================================
// LRM STUDIO BOT
// FLUENT + LIQUID GLASS
// =====================================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const PREFIX = ".";
const DATA_FILE = "./data.json";

// =====================================================
// PALETA
// =====================================================

const COLORS = {
  primary: "#7C8CFF",
  success: "#57F287",
  error: "#ED4245",
  warning: "#FEE75C",
  economy: "#63E6BE",
  level: "#C084FC",
  info: "#60A5FA",
  admin: "#A78BFA"
};

// =====================================================
// SÍMBOLOS FLUENT
// =====================================================

const E = {
  money: "$",
  bank: "▱",
  gain: "＋",
  loss: "−",
  transfer: "⇄",
  inventory: "◇",
  level: "✦",
  time: "◷",
  warning: "⚠",
  error: "×",
  success: "✓",
  info: "◉",
  admin: "⚙",
  logs: "⌁",
  arrow: "›",
  user: "○",
  shop: "▦",
  random: "◆"
};

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================================================
// DATA
// =====================================================

const DEFAULT_DATA = {
  users: {},
  shop: [],
  settings: {
    logs: {
      general: null,
      economia: null,
      tienda: null,
      niveles: null,
      admin: null
    }
  }
};

function cloneDefaultData() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const fresh = cloneDefaultData();

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(fresh, null, 2)
    );

    return fresh;
  }

  try {
    const parsed = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    parsed.users ??= {};
    parsed.shop ??= [];
    parsed.settings ??= {};
    parsed.settings.logs ??= {};

    parsed.settings.logs.general ??= null;
    parsed.settings.logs.economia ??= null;
    parsed.settings.logs.tienda ??= null;
    parsed.settings.logs.niveles ??= null;
    parsed.settings.logs.admin ??= null;

    return parsed;
  } catch (error) {
    console.error("Error leyendo data.json:", error);
    return cloneDefaultData();
  }
}

let data = loadData();

function saveData() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2)
  );
}

function getUser(id) {
  if (!data.users[id]) {
    data.users[id] = {
      wallet: 0,
      bank: 0,
      inventory: [],
      xp: 0,
      level: 1,
      cooldowns: {}
    };

    saveData();
  }

  data.users[id].wallet ??= 0;
  data.users[id].bank ??= 0;
  data.users[id].inventory ??= [];
  data.users[id].xp ??= 0;
  data.users[id].level ??= 1;
  data.users[id].cooldowns ??= {};

  return data.users[id];
}

// =====================================================
// UTILIDADES
// =====================================================

function random(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function money(amount) {
  return Number(amount).toLocaleString("es-ES");
}

function glassEmbed(color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({
      text: "LRM Studio  •  Fluent Glass"
    });
}

function errorEmbed(text) {
  return glassEmbed(COLORS.error)
    .setTitle(`${E.error}  No se pudo completar`)
    .setDescription(text);
}

function successEmbed(text) {
  return glassEmbed(COLORS.success)
    .setTitle(`${E.success}  Completado`)
    .setDescription(text);
}

function warningEmbed(text) {
  return glassEmbed(COLORS.warning)
    .setTitle(`${E.warning}  Atención`)
    .setDescription(text);
}

// =====================================================
// LOGS
// =====================================================

function getLogs() {
  data.settings ??= {};
  data.settings.logs ??= {};

  data.settings.logs.general ??= null;
  data.settings.logs.economia ??= null;
  data.settings.logs.tienda ??= null;
  data.settings.logs.niveles ??= null;
  data.settings.logs.admin ??= null;

  return data.settings.logs;
}

function truncate(text, max = 1000) {
  if (!text) return "*Sin contenido*";

  text = String(text);

  if (text.length <= max) return text;

  return text.slice(0, max - 3) + "...";
}

async function sendLog(
  guild,
  type,
  {
    title,
    description,
    color = COLORS.primary,
    user = null,
    fields = []
  } = {}
) {
  if (!guild) return;

  const logs = getLogs();
  const channelId = logs[type];

  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);

  if (!channel || !channel.isTextBased()) return;

  const embed = glassEmbed(color)
    .setTitle(title || `${E.logs}  LRM Studio • Log`)
    .setDescription(description || "Sin información.")
    .setTimestamp()
    .setFooter({
      text: `LRM Studio  •  ${type}`
    });

  if (user) {
    embed.setAuthor({
      name: user.tag || user.username || "Usuario",
      iconURL: user.displayAvatarURL?.()
    });
  }

  if (fields.length) {
    embed.addFields(fields);
  }

  try {
    await channel.send({
      embeds: [embed]
    });
  } catch (error) {
    console.error(`Error enviando log ${type}:`, error);
  }
}

function logAction(guild, type, options) {
  sendLog(guild, type, options).catch(console.error);

  if (type !== "general") {
    sendLog(guild, "general", options).catch(console.error);
  }
}

// =====================================================
// COOLDOWNS
// =====================================================

function checkCooldown(user, command, duration) {
  const last = user.cooldowns[command] || 0;
  const elapsed = Date.now() - last;

  if (elapsed < duration) {
    return duration - elapsed;
  }

  return 0;
}

function setCooldown(user, command) {
  user.cooldowns[command] = Date.now();
  saveData();
}

function formatTime(ms) {
  let seconds = Math.ceil(ms / 1000);

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  seconds %= 60;

  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds) parts.push(`${seconds}s`);

  return parts.join(" ");
}

function cooldownEmbed(ms) {
  return glassEmbed(COLORS.warning)
    .setTitle(`${E.time}  Cooldown`)
    .setDescription(
      `Este comando todavía no está disponible.\n\n` +
      `${E.time}  Tiempo restante\n` +
      `**${formatTime(ms)}**`
    );
}

// =====================================================
// XP
// =====================================================

function addXP(id) {
  const user = getUser(id);

  const gained = random(3, 8);
  user.xp += gained;

  const required = user.level * 100;

  let levelUp = false;

  if (user.xp >= required) {
    user.xp -= required;
    user.level++;
    levelUp = true;
  }

  saveData();

  return {
    gained,
    levelUp,
    level: user.level
  };
}

// =====================================================
// SLASH COMMANDS
// =====================================================

const userCommands = [
  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Consulta tu balance.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario que quieres consultar.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("work")
    .setDescription("Trabaja para conseguir monedas."),

  new SlashCommandBuilder()
    .setName("risk")
    .setDescription("Realiza una acción económica de riesgo."),

  new SlashCommandBuilder()
    .setName("crime")
    .setDescription("Realiza un crimen ficticio."),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Recoge tu recompensa diaria."),

  new SlashCommandBuilder()
    .setName("dep")
    .setDescription("Deposita dinero en el banco.")
    .addStringOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad o all.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("with")
    .setDescription("Retira dinero del banco.")
    .addStringOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad o all.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Envía dinero a otro usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario que recibirá el dinero.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad de monedas.")
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Consulta tu perfil.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario que quieres consultar.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Consulta tu inventario."),

  new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Consulta tu nivel."),

  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Consulta la tienda."),

  new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Compra un producto.")
    .addStringOption(option =>
      option
        .setName("producto")
        .setDescription("Producto que quieres comprar.")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName("use")
    .setDescription("Utiliza un objeto.")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Objeto que quieres utilizar.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("baltop")
    .setDescription("Ranking de usuarios con más dinero."),

  new SlashCommandBuilder()
    .setName("leveltop")
    .setDescription("Ranking de niveles."),

  new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Lanza una moneda sin apostar."),

  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Pregúntale algo a la bola mágica.")
    .addStringOption(option =>
      option
        .setName("pregunta")
        .setDescription("Tu pregunta.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("random")
    .setDescription("Genera un número aleatorio.")
    .addIntegerOption(option =>
      option
        .setName("minimo")
        .setDescription("Número mínimo.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("maximo")
        .setDescription("Número máximo.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Consulta la latencia."),

  new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Información del bot."),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Información del servidor."),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Información de un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Consulta el avatar.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario.")
        .setRequired(false)
    )
];

const commands = [
  ...userCommands,
  ...adminCommands
].map(command => command.toJSON());

// =====================================================
// REGISTRO
// =====================================================

async function registerCommands() {
  if (!TOKEN) {
    console.error("Falta DISCORD_TOKEN.");
    return;
  }

  if (!CLIENT_ID) {
    console.error("Falta CLIENT_ID.");
    return;
  }

  const rest = new REST({
    version: "10"
  }).setToken(TOKEN);

  try {
    console.log("Registrando comandos slash...");

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      {
        body: commands
      }
    );

    console.log(`Comandos registrados: ${commands.length}`);
  } catch (error) {
    console.error("Error registrando comandos:", error);
  }
}

// =====================================================
// ADMIN
// =====================================================

setupAdmin(client, {
  data,
  saveData,
  sendLog,
  logAction,
  prefix: PREFIX,
  colors: COLORS,
  symbols: E
});

// =====================================================
// READY
// =====================================================

client.once("ready", () => {
  console.log("=================================");
  console.log("       LRM STUDIO BOT");
  console.log(`Conectado como ${client.user.tag}`);
  console.log(`Prefix: ${PREFIX}`);
  console.log("Diseño: Fluent + Liquid Glass");
  console.log("=================================");

  client.user.setActivity("LRM Studio • Fluent Glass");
});

// =====================================================
// LOGS AUTOMÁTICOS
// =====================================================

client.on("messageDelete", message => {
  if (!message.guild) return;
  if (message.author?.bot) return;

  logAction(message.guild, "general", {
    title: `${E.error}  Mensaje eliminado`,
    description:
      `${E.user}  **Autor**\n${message.author || "Desconocido"}\n\n` +
      `${E.info}  **Canal**\n${message.channel}\n\n` +
      `**Contenido**\n${truncate(message.content || "*No disponible*")}`,
    color: COLORS.error,
    user: message.author
  });
});

client.on("messageUpdate", (oldMessage, newMessage) => {
  if (!newMessage.guild) return;
  if (newMessage.author?.bot) return;

  if (oldMessage.content === newMessage.content) return;

  logAction(newMessage.guild, "general", {
    title: `${E.logs}  Mensaje editado`,
    description:
      `${E.user}  **Usuario**\n${newMessage.author}\n\n` +
      `${E.info}  **Canal**\n${newMessage.channel}\n\n` +
      `**Antes**\n${truncate(oldMessage.content || "*Sin contenido*")}\n\n` +
      `**Después**\n${truncate(newMessage.content || "*Sin contenido*")}`,
    color: COLORS.warning,
    user: newMessage.author
  });
});

client.on("guildMemberAdd", member => {
  logAction(member.guild, "general", {
    title: `${E.success}  Nuevo miembro`,
    description:
      `${member} entró al servidor.\n\n` +
      `${E.info}  ID\n\`${member.id}\``,
    color: COLORS.success,
    user: member.user
  });
});

client.on("guildMemberRemove", member => {
  logAction(member.guild, "general", {
    title: `${E.error}  Miembro salió`,
    description:
      `**${member.user.tag}** abandonó el servidor.\n\n` +
      `${E.info}  ID\n\`${member.id}\``,
    color: COLORS.error,
    user: member.user
  });
});

client.on("roleCreate", role => {
  logAction(role.guild, "general", {
    title: `${E.success}  Rol creado`,
    description:
      `${role}\n\n` +
      `${E.info}  ID\n\`${role.id}\``,
    color: COLORS.success
  });
});

client.on("roleDelete", role => {
  logAction(role.guild, "general", {
    title: `${E.error}  Rol eliminado`,
    description:
      `**${role.name}**\n\n` +
      `${E.info}  ID\n\`${role.id}\``,
    color: COLORS.error
  });
});

client.on("roleUpdate", (oldRole, newRole) => {
  const changes = [];

  if (oldRole.name !== newRole.name) {
    changes.push(
      `**Nombre**\n\`${oldRole.name}\` ${E.arrow} \`${newRole.name}\``
    );
  }

  if (oldRole.hexColor !== newRole.hexColor) {
    changes.push(
      `**Color**\n\`${oldRole.hexColor}\` ${E.arrow} \`${newRole.hexColor}\``
    );
  }

  if (
    oldRole.permissions.bitfield !==
    newRole.permissions.bitfield
  ) {
    changes.push("**Permisos**\nModificados");
  }

  if (!changes.length) return;

  logAction(newRole.guild, "general", {
    title: `${E.logs}  Rol modificado`,
    description:
      `${E.info}  ${newRole}\n\n` +
      changes.join("\n\n"),
    color: COLORS.warning
  });
});

client.on("channelCreate", channel => {
  if (!channel.guild) return;

  logAction(channel.guild, "general", {
    title: `${E.success}  Canal creado`,
    description:
      `${channel}\n\n` +
      `${E.info}  **Nombre**\n${channel.name}\n\n` +
      `${E.logs}  **Tipo**\n${channel.type}`,
    color: COLORS.success
  });
});

client.on("channelDelete", channel => {
  if (!channel.guild) return;

  logAction(channel.guild, "general", {
    title: `${E.error}  Canal eliminado`,
    description:
      `**${channel.name}**\n\n` +
      `${E.info}  ID\n\`${channel.id}\``,
    color: COLORS.error
  });
});

client.on("channelUpdate", (oldChannel, newChannel) => {
  if (!newChannel.guild) return;

  const changes = [];

  if (oldChannel.name !== newChannel.name) {
    changes.push(
      `**Nombre**\n\`${oldChannel.name}\` ${E.arrow} \`${newChannel.name}\``
    );
  }

  if (oldChannel.topic !== newChannel.topic) {
    changes.push("**Tema**\nModificado");
  }

  if (oldChannel.parentId !== newChannel.parentId) {
    changes.push("**Categoría**\nModificada");
  }

  if (!changes.length) return;

  logAction(newChannel.guild, "general", {
    title: `${E.logs}  Canal modificado`,
    description:
      `${E.info}  ${newChannel}\n\n` +
      changes.join("\n\n"),
    color: COLORS.warning
  });
});

client.on("guildUpdate", (oldGuild, newGuild) => {
  const changes = [];

  if (oldGuild.name !== newGuild.name) {
    changes.push(
      `**Nombre**\n\`${oldGuild.name}\` ${E.arrow} \`${newGuild.name}\``
    );
  }

  if (oldGuild.description !== newGuild.description) {
    changes.push("**Descripción**\nModificada");
  }

  if (oldGuild.icon !== newGuild.icon) {
    changes.push("**Icono**\nModificado");
  }

  if (!changes.length) return;

  logAction(newGuild, "general", {
    title: `${E.warning}  Servidor modificado`,
    description: changes.join("\n\n"),
    color: COLORS.warning
  });
});

// =====================================================
// PREFIX
// =====================================================

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/ +/);

  const command = args.shift()?.toLowerCase();

  if (!command) return;

  if (command === "help") {
    const embed = glassEmbed()
      .setTitle(`${E.info}  LRM Studio`)
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        `### Fluent Glass\n` +
        `Todo lo que necesitás, organizado en un solo lugar.\n\n` +
        `${E.money}  **Economía**\n` +
        `${E.level}  **Perfil y niveles**\n` +
        `${E.shop}  **Tienda**\n` +
        `${E.random}  **Rankings**\n` +
        `${E.success}  **Diversión**\n` +
        `${E.info}  **Información**\n\n` +
        `${E.admin}  Administración: **.admin**`
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("lrm_help_menu")
      .setPlaceholder("Explorar categorías")
      .addOptions(
        {
          label: "Economía",
          description: "Balance, banco y monedas.",
          value: "economia",
          emoji: "💵"
        },
        {
          label: "Perfil",
          description: "Perfil, inventario y niveles.",
          value: "perfil",
          emoji: "👤"
        },
        {
          label: "Tienda",
          description: "Productos y roles.",
          value: "tienda",
          emoji: "🛍️"
        },
        {
          label: "Rankings",
          description: "Clasificaciones del servidor.",
          value: "rankings",
          emoji: "🏆"
        },
        {
          label: "Diversión",
          description: "Comandos casuales.",
          value: "diversion",
          emoji: "🎲"
        },
        {
          label: "Información",
          description: "Bot, servidor y usuarios.",
          value: "informacion",
          emoji: "ℹ️"
        }
      );

    return message.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }
});

// =====================================================
// INTERACTIONS
// =====================================================

client.on("interactionCreate", async interaction => {
  // AUTOCOMPLETE

  if (interaction.isAutocomplete()) {
    if (interaction.commandName === "buy") {
      const focused = interaction.options
        .getFocused()
        .toLowerCase();

      const results = data.shop
        .filter(product =>
          product.name
            .toLowerCase()
            .includes(focused)
        )
        .slice(0, 25);

      return interaction.respond(
        results.map(product => ({
          name:
            `${product.name} • ` +
            `${money(product.price)} monedas`,
          value: product.name
        }))
      );
    }

    return;
  }

  // HELP MENU

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "lrm_help_menu"
  ) {
    const category = interaction.values[0];

    const embed = glassEmbed();

    if (category === "economia") {
      embed
        .setColor(COLORS.economy)
        .setTitle(`${E.money}  Economía`)
        .setDescription(
          `${E.money}  **/balance**\nConsulta tu dinero.\n\n` +
          `${E.gain}  **/work**\nGana 20-30 monedas cada 30 segundos.\n\n` +
          `${E.warning}  **/risk**\nAcción económica de riesgo.\n\n` +
          `${E.warning}  **/crime**\nAcción económica ficticia de riesgo.\n\n` +
          `${E.gain}  **/daily**\nRecibe 50 monedas cada 24 horas.\n\n` +
          `${E.bank}  **/dep**\nDeposita monedas.\n\n` +
          `${E.bank}  **/with**\nRetira monedas.\n\n` +
          `${E.transfer}  **/pay**\nEnvía monedas.`
        );
    }

    if (category === "perfil") {
      embed
        .setColor(COLORS.level)
        .setTitle(`${E.user}  Perfil`)
        .setDescription(
          `${E.user}  **/profile**\nConsulta un perfil.\n\n` +
          `${E.money}  **/balance**\nConsulta el balance.\n\n` +
          `${E.level}  **/rank**\nConsulta nivel y XP.\n\n` +
          `${E.inventory}  **/inventory**\nConsulta tus objetos.`
        );
    }

    if (category === "tienda") {
      embed
        .setColor(COLORS.economy)
        .setTitle(`${E.shop}  Tienda`)
        .setDescription(
          `${E.shop}  **/shop**\nAbre la tienda.\n\n` +
          `${E.money}  **/buy**\nCompra un producto.\n\n` +
          `${E.inventory}  **/use**\nUtiliza un objeto.`
        );
    }

    if (category === "rankings") {
      embed
        .setColor(COLORS.level)
        .setTitle(`${E.level}  Rankings`)
        .setDescription(
          `${E.money}  **/baltop**\nRanking económico.\n\n` +
          `${E.level}  **/leveltop**\nRanking de niveles.`
        );
    }

    if (category === "diversion") {
      embed
        .setColor(COLORS.primary)
        .setTitle(`${E.random}  Diversión`)
        .setDescription(
          `**/coinflip**\nCara o cruz, sin apuestas.\n\n` +
          `**/8ball**\nPregunta a la bola mágica.\n\n` +
          `**/random**\nGenera un número aleatorio.`
        );
    }

    if (category === "informacion") {
      embed
        .setColor(COLORS.info)
        .setTitle(`${E.info}  Información`)
        .setDescription(
          `${E.time}  **/ping**\nLatencia del bot.\n\n` +
          `${E.info}  **/botinfo**\nInformación del bot.\n\n` +
          `${E.info}  **/serverinfo**\nInformación del servidor.\n\n` +
          `${E.user}  **/userinfo**\nInformación de usuarios.\n\n` +
          `${E.user}  **/avatar**\nConsulta avatares.`
        );
    }

    return interaction.update({
      embeds: [embed]
    });
  }

  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  // ===================================================
  // BALANCE
  // ===================================================

  if (command === "balance") {
    const target =
      interaction.options.getUser("usuario") ||
      interaction.user;

    const user = getUser(target.id);

    const total = user.wallet + user.bank;

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.economy)
          .setTitle(`${E.money}  Balance`)
          .setAuthor({
            name: target.username,
            iconURL: target.displayAvatarURL()
          })
          .addFields(
            {
              name: `${E.money}  Efectivo`,
              value: `**${money(user.wallet)}**`,
              inline: true
            },
            {
              name: `${E.bank}  Banco`,
              value: `**${money(user.bank)}**`,
              inline: true
            },
            {
              name: `${E.money}  Patrimonio`,
              value: `**${money(total)}**`,
              inline: false
            }
          )
      ]
    });
  }

  // ===================================================
  // WORK
  // ===================================================

  if (command === "work") {
    const user = getUser(interaction.user.id);

    const cooldown = checkCooldown(
      user,
      "work",
      30000
    );

    if (cooldown) {
      return interaction.reply({
        embeds: [cooldownEmbed(cooldown)],
        ephemeral: true
      });
    }

    const amount = random(20, 30);

    user.wallet += amount;

    setCooldown(user, "work");

    const xp = addXP(interaction.user.id);

    saveData();

    logAction(interaction.guild, "economia", {
      title: `${E.gain}  Trabajo completado`,
      description:
        `${interaction.user} recibió **${money(amount)} monedas**.`,
      color: COLORS.success,
      user: interaction.user
    });

    if (xp.levelUp) {
      logAction(interaction.guild, "niveles", {
        title: `${E.level}  Nuevo nivel`,
        description:
          `${interaction.user} alcanzó el **nivel ${xp.level}**.`,
        color: COLORS.level,
        user: interaction.user
      });
    }

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.gain}  Ganancia\n` +
          `**+$${money(amount)}**\n\n` +
          `${E.money}  Efectivo\n` +
          `**$${money(user.wallet)}**`
        )
      ]
    });
  }

  // ===================================================
  // RISK
  // ===================================================

  if (command === "risk") {
    const user = getUser(interaction.user.id);

    const cooldown = checkCooldown(
      user,
      "risk",
      60000
    );

    if (cooldown) {
      return interaction.reply({
        embeds: [cooldownEmbed(cooldown)],
        ephemeral: true
      });
    }

    setCooldown(user, "risk");

    const loses = Math.random() < 0.70;

    if (loses) {
      const amount = random(50, 100);

      user.wallet -= amount;

      saveData();

      logAction(interaction.guild, "economia", {
        title: `${E.loss}  Operación fallida`,
        description:
          `${interaction.user} perdió **${money(amount)} monedas**.`,
        color: COLORS.error,
        user: interaction.user
      });

      return interaction.reply({
        embeds: [
          glassEmbed(COLORS.error)
            .setTitle(`${E.loss}  Resultado negativo`)
            .setDescription(
              `${E.loss}  Pérdida\n` +
              `**-$${money(amount)}**\n\n` +
              `${E.money}  Efectivo\n` +
              `**$${money(user.wallet)}**`
            )
        ]
      });
    }

    const amount = random(40, 70);

    user.wallet += amount;

    const xp = addXP(interaction.user.id);

    saveData();

    logAction(interaction.guild, "economia", {
      title: `${E.gain}  Operación completada`,
      description:
        `${interaction.user} ganó **${money(amount)} monedas**.`,
      color: COLORS.success,
      user: interaction.user
    });

    if (xp.levelUp) {
      logAction(interaction.guild, "niveles", {
        title: `${E.level}  Nuevo nivel`,
        description:
          `${interaction.user} alcanzó el **nivel ${xp.level}**.`,
        color: COLORS.level,
        user: interaction.user
      });
    }

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.gain}  Ganancia\n` +
          `**+$${money(amount)}**\n\n` +
          `${E.money}  Efectivo\n` +
          `**$${money(user.wallet)}**`
        )
      ]
    });
  }

  // ===================================================
  // CRIME
  // ===================================================

  if (command === "crime") {
    const user = getUser(interaction.user.id);

    const cooldown = checkCooldown(
      user,
      "crime",
      120000
    );

    if (cooldown) {
      return interaction.reply({
        embeds: [cooldownEmbed(cooldown)],
        ephemeral: true
      });
    }

    setCooldown(user, "crime");

    const loses = Math.random() < 0.80;

    if (loses) {
      const amount = random(70, 200);

      user.wallet -= amount;
      saveData();

      logAction(interaction.guild, "economia", {
        title: `${E.warning}  Acción fallida`,
        description:
          `${interaction.user} recibió una penalización de **${money(amount)} monedas**.`,
        color: COLORS.error,
        user: interaction.user
      });

      return interaction.reply({
        embeds: [
          glassEmbed(COLORS.error)
            .setTitle(`${E.loss}  Resultado negativo`)
            .setDescription(
              `${E.loss}  Penalización\n` +
              `**-$${money(amount)}**\n\n` +
              `${E.money}  Efectivo\n` +
              `**$${money(user.wallet)}**`
            )
        ]
      });
    }

    const amount = random(50, 80);

    user.wallet += amount;

    const xp = addXP(interaction.user.id);

    saveData();

    logAction(interaction.guild, "economia", {
      title: `${E.gain}  Acción completada`,
      description:
        `${interaction.user} ganó **${money(amount)} monedas**.`,
      color: COLORS.success,
      user: interaction.user
    });

    if (xp.levelUp) {
      logAction(interaction.guild, "niveles", {
        title: `${E.level}  Nuevo nivel`,
        description:
          `${interaction.user} alcanzó el **nivel ${xp.level}**.`,
        color: COLORS.level,
        user: interaction.user
      });
    }

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.gain}  Ganancia\n` +
          `**+$${money(amount)}**\n\n` +
          `${E.money}  Efectivo\n` +
          `**$${money(user.wallet)}**`
        )
      ]
    });
  }

  // ===================================================
  // DAILY
  // ===================================================

  if (command === "daily") {
    const user = getUser(interaction.user.id);

    const cooldown = checkCooldown(
      user,
      "daily",
      86400000
    );

    if (cooldown) {
      return interaction.reply({
        embeds: [cooldownEmbed(cooldown)],
        ephemeral: true
      });
    }

    user.wallet += 50;

    setCooldown(user, "daily");
    saveData();

    logAction(interaction.guild, "economia", {
      title: `${E.gain}  Daily`,
      description:
        `${interaction.user} recibió **50 monedas**.`,
      color: COLORS.success,
      user: interaction.user
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.gain}  Recompensa diaria\n` +
          `**+$50**\n\n` +
          `${E.time}  Disponible nuevamente en **24 horas**.`
        )
      ]
    });
  }

  // ===================================================
  // DEP
  // ===================================================

  if (command === "dep") {
    const user = getUser(interaction.user.id);

    const input = interaction.options
      .getString("cantidad")
      .trim()
      .toLowerCase();

    if (user.wallet <= 0) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.money}  No tienes efectivo disponible para depositar.`
          )
        ],
        ephemeral: true
      });
    }

    const amount =
      input === "all"
        ? user.wallet
        : Number(input);

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `Introduce una cantidad válida o **all**.`
          )
        ],
        ephemeral: true
      });
    }

    if (amount > user.wallet) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.money}  No tienes suficiente efectivo.`
          )
        ],
        ephemeral: true
      });
    }

    user.wallet -= amount;
    user.bank += amount;

    saveData();

    logAction(interaction.guild, "economia", {
      title: `${E.bank}  Depósito`,
      description:
        `${interaction.user} depositó **${money(amount)} monedas**.`,
      user: interaction.user
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.bank}  Depositado\n` +
          `**$${money(amount)}**\n\n` +
          `${E.money}  Efectivo: **$${money(user.wallet)}**\n` +
          `${E.bank}  Banco: **$${money(user.bank)}**`
        )
      ]
    });
  }

  // ===================================================
  // WITH
  // ===================================================

  if (command === "with") {
    const user = getUser(interaction.user.id);

    const input = interaction.options
      .getString("cantidad")
      .trim()
      .toLowerCase();

    const amount =
      input === "all"
        ? user.bank
        : Number(input);

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `Introduce una cantidad válida o **all**.`
          )
        ],
        ephemeral: true
      });
    }

    if (amount > user.bank) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.bank}  No tienes suficiente dinero en el banco.`
          )
        ],
        ephemeral: true
      });
    }

    user.bank -= amount;
    user.wallet += amount;

    saveData();

    logAction(interaction.guild, "economia", {
      title: `${E.bank}  Retiro`,
      description:
        `${interaction.user} retiró **${money(amount)} monedas**.`,
      user: interaction.user
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.bank}  Retirado\n` +
          `**$${money(amount)}**\n\n` +
          `${E.money}  Efectivo: **$${money(user.wallet)}**\n` +
          `${E.bank}  Banco: **$${money(user.bank)}**`
        )
      ]
    });
  }

  // ===================================================
  // PAY
  // ===================================================

  if (command === "pay") {
    const target =
      interaction.options.getUser("usuario");

    const amount =
      interaction.options.getInteger("cantidad");

    if (target.bot) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `No puedes transferir monedas a un bot.`
          )
        ],
        ephemeral: true
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `No puedes transferirte monedas a vos mismo.`
          )
        ],
        ephemeral: true
      });
    }

    const sender = getUser(interaction.user.id);
    const receiver = getUser(target.id);

    if (sender.wallet < amount) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.money}  No tienes suficiente efectivo.`
          )
        ],
        ephemeral: true
      });
    }

    sender.wallet -= amount;
    receiver.wallet += amount;

    saveData();

    logAction(interaction.guild, "economia", {
      title: `${E.transfer}  Transferencia`,
      description:
        `${interaction.user} ${E.arrow} ${target}\n\n` +
        `${E.money}  **$${money(amount)}**`,
      color: COLORS.success,
      user: interaction.user
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.transfer}  Transferiste **$${money(amount)}** a ${target}.\n\n` +
          `${E.money}  Saldo restante: **$${money(sender.wallet)}**`
        )
      ]
    });
  }

  // ===================================================
  // PROFILE
  // ===================================================

  if (command === "profile") {
    const target =
      interaction.options.getUser("usuario") ||
      interaction.user;

    const user = getUser(target.id);

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.level)
          .setAuthor({
            name: target.username,
            iconURL: target.displayAvatarURL()
          })
          .setTitle(`${E.user}  Perfil`)
          .addFields(
            {
              name: `${E.money}  Efectivo`,
              value: `**$${money(user.wallet)}**`,
              inline: true
            },
            {
              name: `${E.bank}  Banco`,
              value: `**$${money(user.bank)}**`,
              inline: true
            },
            {
              name: `${E.money}  Total`,
              value: `**$${money(user.wallet + user.bank)}**`,
              inline: true
            },
            {
              name: `${E.level}  Nivel`,
              value: `**${user.level}**`,
              inline: true
            },
            {
              name: `XP`,
              value: `**${user.xp}/${user.level * 100}**`,
              inline: true
            },
            {
              name: `${E.inventory}  Objetos`,
              value: `**${user.inventory.length}**`,
              inline: true
            }
          )
      ]
    });
  }

  // ===================================================
  // INVENTORY
  // ===================================================

  if (command === "inventory") {
    const user = getUser(interaction.user.id);

    let description;

    if (!user.inventory.length) {
      description =
        `${E.inventory}  Tu inventario está vacío.`;
    } else {
      const counts = {};

      for (const item of user.inventory) {
        counts[item] = (counts[item] || 0) + 1;
      }

      description = Object.entries(counts)
        .map(
          ([name, amount]) =>
            `${E.inventory}  **${name}**  ×${amount}`
        )
        .join("\n");
    }

    return interaction.reply({
      embeds: [
        glassEmbed()
          .setTitle(`${E.inventory}  Inventario`)
          .setDescription(description)
      ]
    });
  }

  // ===================================================
  // RANK
  // ===================================================

  if (command === "rank") {
    const user = getUser(interaction.user.id);

    const required = user.level * 100;

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.level)
          .setTitle(`${E.level}  Progreso`)
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setDescription(
            `${E.level}  **Nivel ${user.level}**\n\n` +
            `XP\n**${user.xp} / ${required}**`
          )
      ]
    });
  }

  // ===================================================
  // SHOP
  // ===================================================

  if (command === "shop") {
    if (!data.shop.length) {
      return interaction.reply({
        embeds: [
          glassEmbed(COLORS.economy)
            .setTitle(`${E.shop}  LRM Shop`)
            .setDescription(
              `${E.inventory}  No hay productos disponibles.`
            )
        ]
      });
    }

    const products = data.shop
      .map((product, index) => {
        const type =
          product.type === "role"
            ? "Rol"
            : "Ítem";

        return (
          `**${String(index + 1).padStart(2, "0")}  ${product.name}**\n` +
          `${E.info}  ${type}   •   ${E.money}  $${money(product.price)}`
        );
      })
      .join("\n\n");

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.economy)
          .setTitle(`${E.shop}  LRM Shop`)
          .setDescription(products)
      ]
    });
  }

  // ===================================================
  // BUY
  // ===================================================

  if (command === "buy") {
    const name =
      interaction.options.getString("producto");

    const product = data.shop.find(
      product =>
        product.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (!product) {
      return interaction.reply({
        embeds: [
          errorEmbed("Ese producto no existe.")
        ],
        ephemeral: true
      });
    }

    const user = getUser(interaction.user.id);

    if (user.wallet < product.price) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `${E.money}  Precio: **$${money(product.price)}**\n` +
            `${E.money}  Tu saldo: **$${money(user.wallet)}**`
          )
        ],
        ephemeral: true
      });
    }

    if (product.type === "role") {
      const role =
        interaction.guild.roles.cache.get(
          product.roleId
        );

      if (!role) {
        return interaction.reply({
          embeds: [
            errorEmbed("El rol ya no existe.")
          ],
          ephemeral: true
        });
      }

      if (
        interaction.member.roles.cache.has(
          role.id
        )
      ) {
        return interaction.reply({
          embeds: [
            errorEmbed("Ya tienes este rol.")
          ],
          ephemeral: true
        });
      }

      try {
        await interaction.member.roles.add(role);
      } catch (error) {
        console.error(error);

        return interaction.reply({
          embeds: [
            errorEmbed(
              "No pude entregarte el rol. Revisa la jerarquía de roles del bot."
            )
          ],
          ephemeral: true
        });
      }

      user.wallet -= product.price;
      saveData();

      logAction(interaction.guild, "tienda", {
        title: `${E.shop}  Compra de rol`,
        description:
          `${interaction.user} compró **${product.name}**.\n\n` +
          `${E.money}  **$${money(product.price)}**\n` +
          `${E.level}  ${role}`,
        color: COLORS.success,
        user: interaction.user
      });

      return interaction.reply({
        embeds: [
          successEmbed(
            `${E.shop}  **${product.name}**\n\n` +
            `${E.level}  Recibiste ${role}\n\n` +
            `${E.money}  Saldo: **$${money(user.wallet)}**`
          )
        ]
      });
    }

    user.wallet -= product.price;
    user.inventory.push(product.name);

    saveData();

    logAction(interaction.guild, "tienda", {
      title: `${E.shop}  Compra`,
      description:
        `${interaction.user} compró **${product.name}** por **$${money(product.price)}**.`,
      color: COLORS.success,
      user: interaction.user
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.shop}  Compraste **${product.name}**.\n\n` +
          `${E.inventory}  Añadido a tu inventario.\n\n` +
          `${E.money}  Saldo: **$${money(user.wallet)}**`
        )
      ]
    });
  }

  // ===================================================
  // USE
  // ===================================================

  if (command === "use") {
    const item =
      interaction.options.getString("item");

    const user = getUser(interaction.user.id);

    const index = user.inventory.findIndex(
      inventoryItem =>
        inventoryItem.toLowerCase() ===
        item.toLowerCase()
    );

    if (index === -1) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `No tienes **${item}** en tu inventario.`
          )
        ],
        ephemeral: true
      });
    }

    user.inventory.splice(index, 1);
    saveData();

    logAction(interaction.guild, "tienda", {
      title: `${E.inventory}  Objeto utilizado`,
      description:
        `${interaction.user} utilizó **${item}**.`,
      user: interaction.user
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `${E.inventory}  Utilizaste **${item}**.`
        )
      ]
    });
  }

  // ===================================================
  // BALTOP
  // ===================================================

  if (command === "baltop") {
    const ranking = Object.entries(data.users)
      .map(([id, user]) => ({
        id,
        total:
          Number(user.wallet || 0) +
          Number(user.bank || 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (!ranking.length) {
      return interaction.reply({
        embeds: [
          errorEmbed("Todavía no hay usuarios.")
        ]
      });
    }

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.economy)
          .setTitle(`${E.money}  Ranking económico`)
          .setDescription(
            ranking
              .map(
                (entry, index) =>
                  `**${index + 1}.** <@${entry.id}>  •  **$${money(entry.total)}**`
              )
              .join("\n")
          )
      ]
    });
  }

  // ===================================================
  // LEVELTOP
  // ===================================================

  if (command === "leveltop") {
    const ranking = Object.entries(data.users)
      .sort(([, a], [, b]) => {
        if (b.level !== a.level) {
          return b.level - a.level;
        }

        return b.xp - a.xp;
      })
      .slice(0, 10);

    if (!ranking.length) {
      return interaction.reply({
        embeds: [
          errorEmbed("Todavía no hay usuarios.")
        ]
      });
    }

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.level)
          .setTitle(`${E.level}  Ranking de niveles`)
          .setDescription(
            ranking
              .map(
                ([id, user], index) =>
                  `**${index + 1}.** <@${id}>  •  Nivel **${user.level}**  •  ${user.xp} XP`
              )
              .join("\n")
          )
      ]
    });
  }

  // ===================================================
  // COINFLIP
  // ===================================================

  if (command === "coinflip") {
    const result =
      Math.random() < 0.5
        ? "Cara"
        : "Cruz";

    return interaction.reply({
      embeds: [
        glassEmbed()
          .setTitle(`${E.random}  Coinflip`)
          .setDescription(
            `Resultado\n\n## ${result}`
          )
      ]
    });
  }

  // ===================================================
  // 8BALL
  // ===================================================

  if (command === "8ball") {
    const question =
      interaction.options.getString("pregunta");

    const responses = [
      "Sí.",
      "No.",
      "Probablemente.",
      "No lo creo.",
      "Todo apunta a que sí.",
      "Tengo mis dudas.",
      "Pregunta de nuevo más tarde.",
      "Definitivamente.",
      "Puede ser."
    ];

    const answer =
      responses[
        random(0, responses.length - 1)
      ];

    return interaction.reply({
      embeds: [
        glassEmbed()
          .setTitle(`${E.random}  Bola mágica`)
          .addFields(
            {
              name: `${E.info}  Pregunta`,
              value: question
            },
            {
              name: `${E.random}  Respuesta`,
              value: `**${answer}**`
            }
          )
      ]
    });
  }

  // ===================================================
  // RANDOM
  // ===================================================

  if (command === "random") {
    const min =
      interaction.options.getInteger("minimo");

    const max =
      interaction.options.getInteger("maximo");

    if (min >= max) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "El máximo debe ser mayor que el mínimo."
          )
        ],
        ephemeral: true
      });
    }

    const result = random(min, max);

    return interaction.reply({
      embeds: [
        glassEmbed()
          .setTitle(`${E.random}  Número aleatorio`)
          .setDescription(
            `Rango  •  **${min} — ${max}**\n\n` +
            `## ${result}`
          )
      ]
    });
  }

  // ===================================================
  // PING
  // ===================================================

  if (command === "ping") {
    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.info)
          .setTitle(`${E.time}  Pong`)
          .setDescription(
            `Latencia\n## ${client.ws.ping} ms`
          )
      ]
    });
  }

  // ===================================================
  // BOTINFO
  // ===================================================

  if (command === "botinfo") {
    return interaction.reply({
      embeds: [
        glassEmbed()
          .setTitle(`${E.info}  LRM Studio`)
          .setThumbnail(
            client.user.displayAvatarURL()
          )
          .setDescription(
            `### Fluent Glass\n` +
            `Sistema multipropósito para Discord.\n\n` +
            `${E.money}  Economía\n` +
            `${E.level}  Niveles y XP\n` +
            `${E.shop}  Tienda configurable\n` +
            `${E.logs}  Logs\n` +
            `${E.info}  Información\n\n` +
            `${E.arrow}  Usa **.help** para explorar los comandos.`
          )
      ]
    });
  }

  // ===================================================
  // SERVERINFO
  // ===================================================

  if (command === "serverinfo") {
    const guild = interaction.guild;

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.info)
          .setTitle(`${E.info}  ${guild.name}`)
          .setThumbnail(
            guild.iconURL() ||
            client.user.displayAvatarURL()
          )
          .addFields(
            {
              name: `${E.user}  Miembros`,
              value: `**${guild.memberCount}**`,
              inline: true
            },
            {
              name: `${E.info}  Canales`,
              value: `**${guild.channels.cache.size}**`,
              inline: true
            },
            {
              name: `${E.level}  Roles`,
              value: `**${guild.roles.cache.size}**`,
              inline: true
            },
            {
              name: "ID",
              value: `\`${guild.id}\``
            }
          )
      ]
    });
  }

  // ===================================================
  // USERINFO
  // ===================================================

  if (command === "userinfo") {
    const target =
      interaction.options.getUser("usuario") ||
      interaction.user;

    const member =
      await interaction.guild.members
        .fetch(target.id)
        .catch(() => null);

    const joined =
      member?.joinedTimestamp
        ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
        : "Desconocido";

    const created =
      `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`;

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.info)
          .setTitle(`${E.user}  ${target.username}`)
          .setThumbnail(
            target.displayAvatarURL()
          )
          .addFields(
            {
              name: `${E.user}  Usuario`,
              value: `${target}`,
              inline: true
            },
            {
              name: "ID",
              value: `\`${target.id}\``,
              inline: true
            },
            {
              name: `${E.time}  Cuenta creada`,
              value: created
            },
            {
              name: `${E.time}  Entró al servidor`,
              value: joined
            }
          )
      ]
    });
  }

  // ===================================================
  // AVATAR
  // ===================================================

  if (command === "avatar") {
    const target =
      interaction.options.getUser("usuario") ||
      interaction.user;

    return interaction.reply({
      embeds: [
        glassEmbed()
          .setTitle(`${E.user}  Avatar de ${target.username}`)
          .setImage(
            target.displayAvatarURL({
              size: 1024
            })
          )
      ]
    });
  }
});

// =====================================================
// ERRORES
// =====================================================

process.on("unhandledRejection", error => {
  console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("Uncaught Exception:", error);
});

// =====================================================
// START
// =====================================================

registerCommands();
client.login(TOKEN);

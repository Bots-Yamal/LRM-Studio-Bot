const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField
} = require("discord.js");

const fs = require("fs");

// ======================================================
// CONFIG
// ======================================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const PREFIX = ".";
const DATA_FILE = "./data.json";

const ALLIANCE_ROLE_ID = "1565728408619720857";

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// ======================================================
// COLORES
// ======================================================

const COLORS = {
  primary: "#7C8CFF",
  success: "#57F287",
  error: "#ED4245",
  warning: "#FEE75C",
  level: "#C084FC",
  info: "#60A5FA",
  admin: "#A78BFA",
  alliance: "#F5B7FF",
  affy: "#FF9EDB",
  security: "#FF6B6B"
};

// ======================================================
// DATA
// ======================================================

const DEFAULT_DATA = {
  users: {},
  guildSettings: {},
  inviteSystem: {},
  partners: {},
  moderation: {},
  tickets: {},
  giveaways: {},
  reminders: {},
  achievements: {},
  streaks: {},
  antiSpam: {},
  logs: {}
};

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(DEFAULT_DATA, null, 2)
    );

    return JSON.parse(
      JSON.stringify(DEFAULT_DATA)
    );
  }

  try {
    const data = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    data.users ??= {};
    data.guildSettings ??= {};
    data.inviteSystem ??= {};
    data.partners ??= {};
    data.moderation ??= {};
    data.tickets ??= {};
    data.giveaways ??= {};
    data.reminders ??= {};
    data.achievements ??= {};
    data.streaks ??= {};
    data.antiSpam ??= {};
    data.logs ??= {};

    return data;

  } catch (error) {
    console.error("Error leyendo data.json:", error);

    return JSON.parse(
      JSON.stringify(DEFAULT_DATA)
    );
  }
}

let data = loadData();

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error("Error guardando data.json:", error);
  }
}

// ======================================================
// GUILD SETTINGS
// ======================================================

function getGuildSettings(guildId) {
  data.guildSettings ??= {};

  data.guildSettings[guildId] ??= {
    welcomeChannel: null,
    goodbyeChannel: null,
    inviteChannel: null,
    levelChannel: null,
    allianceChannel: null,
    affysChannel: null,
    suggestionChannel: null,
    ticketChannel: null,
    logChannels: {},
    antiSpamEnabled: true,
    antiSpamMuteMinutes: 60
  };

  const settings =
    data.guildSettings[guildId];

  settings.welcomeChannel ??= null;
  settings.goodbyeChannel ??= null;
  settings.inviteChannel ??= null;
  settings.levelChannel ??= null;
  settings.allianceChannel ??= null;
  settings.affysChannel ??= null;
  settings.suggestionChannel ??= null;
  settings.ticketChannel ??= null;
  settings.logChannels ??= {};
  settings.antiSpamEnabled ??= true;
  settings.antiSpamMuteMinutes ??= 60;

  return settings;
}

// ======================================================
// USUARIOS
// ======================================================

function getUser(id) {
  data.users ??= {};

  data.users[id] ??= {
    xp: 0,
    level: 1,
    warnings: {},
    messages: 0,
    achievements: [],
    lastMessage: 0,
    streak: 0
  };

  const user = data.users[id];

  user.xp ??= 0;
  user.level ??= 1;
  user.warnings ??= {};
  user.messages ??= 0;
  user.achievements ??= [];
  user.lastMessage ??= 0;
  user.streak ??= 0;

  return user;
}

// ======================================================
// UTILIDADES
// ======================================================

function random(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function glassEmbed({
  title,
  description,
  color = COLORS.primary,
  fields = [],
  image = null
}) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description || null)
    .setFooter({
      text: "LRM Studio • Fluent Glass"
    })
    .setTimestamp();

  if (fields.length) {
    embed.addFields(fields);
  }

  if (image) {
    embed.setImage(image);
  }

  return embed;
}

function errorEmbed(text) {
  return glassEmbed({
    title: "❌ Error",
    description: text,
    color: COLORS.error
  });
}

function successEmbed(text) {
  return glassEmbed({
    title: "✅ Completado",
    description: text,
    color: COLORS.success
  });
}

function isAdmin(member) {
  if (!member) return false;

  return (
    member.permissions.has(
      PermissionsBitField.Flags.Administrator
    ) ||
    member.guild.ownerId === member.id
  );
}

function isStaff(member) {
  if (!member) return false;

  return (
    isAdmin(member) ||
    member.roles.cache.has(ALLIANCE_ROLE_ID)
  );
}

// ======================================================
// XP / NIVELES
// ======================================================

function xpNeeded(level) {
  return level * 100;
}

function getRank(guild, userId) {
  const ranking = Object.entries(data.users)
    .map(([id, user]) => ({
      id,
      xp: user.xp || 0
    }))
    .sort((a, b) => b.xp - a.xp);

  return (
    ranking.findIndex(
      item => item.id === userId
    ) + 1
  );
}

async function addXP(userId, amount, guild) {
  const user = getUser(userId);

  user.xp += amount;

  let leveledUp = false;

  while (
    user.xp >= xpNeeded(user.level)
  ) {
    user.xp -= xpNeeded(user.level);
    user.level++;
    leveledUp = true;
  }

  saveData();

  if (leveledUp && guild) {
    const settings =
      getGuildSettings(guild.id);

    const channel =
      settings.levelChannel
        ? guild.channels.cache.get(
            settings.levelChannel
          )
        : null;

    if (channel) {
      await channel.send({
        embeds: [
          glassEmbed({
            title: "🎉・¡Subiste de Nivel!",
            description:
              `¡Felicidades <@${userId}>! ✨\n\n` +
              `🏆 Nivel: **${user.level}**\n` +
              `⭐ XP: **${user.xp}**\n` +
              `📊 Rank: **#${getRank(guild, userId)}**`,
            color: COLORS.level
          })
        ]
      }).catch(() => {});
    }

    await logAction(
      guild,
      "levels",
      "🎉 Subida de nivel",
      `<@${userId}> alcanzó el nivel **${user.level}**.`
    );
  }
}

// ======================================================
// LOGS
// ======================================================

async function sendLog(guild, type, embed) {
  try {
    const settings =
      getGuildSettings(guild.id);

    const channelId =
      settings.logChannels?.[type];

    if (!channelId) return;

    const channel =
      guild.channels.cache.get(channelId);

    if (!channel) return;

    await channel.send({
      embeds: [embed]
    });

  } catch (error) {
    console.error(
      "Error enviando log:",
      error.message
    );
  }
}

async function logAction(
  guild,
  type,
  title,
  description,
  color = COLORS.info
) {
  return sendLog(
    guild,
    type,
    glassEmbed({
      title,
      description,
      color
    })
  );
}

// ======================================================
// INVITACIONES
// ======================================================

const inviteCache = new Map();

async function cacheInvites(guild) {
  try {
    const invites =
      await guild.invites.fetch();

    const map = new Map();

    invites.forEach(invite => {
      map.set(
        invite.code,
        invite.uses || 0
      );
    });

    inviteCache.set(
      guild.id,
      map
    );

  } catch (error) {
    console.error(
      `No se pudieron obtener las invitaciones de ${guild.name}:`,
      error.message
    );
  }
}

async function findUsedInvite(guild) {
  try {
    const oldMap =
      inviteCache.get(
        guild.id
      ) || new Map();

    const invites =
      await guild.invites.fetch();

    let usedInvite = null;

    invites.forEach(invite => {
      const oldUses =
        oldMap.get(invite.code) || 0;

      const newUses =
        invite.uses || 0;

      if (
        newUses > oldUses &&
        !usedInvite
      ) {
        usedInvite = invite;
      }
    });

    const newMap = new Map();

    invites.forEach(invite => {
      newMap.set(
        invite.code,
        invite.uses || 0
      );
    });

    inviteCache.set(
      guild.id,
      newMap
    );

    return usedInvite;

  } catch (error) {
    console.error(
      "Error detectando invitación:",
      error.message
    );

    return null;
  }
}

// ======================================================
// PARTNERS
// ======================================================

function getPartner(guildId, inviteGuildId, name) {
  data.partners[guildId] ??= {};

  data.partners[guildId][inviteGuildId] ??= {
    points: 0,
    invites: 0,
    name
  };

  const partner =
    data.partners[guildId][inviteGuildId];

  partner.name = name;

  return partner;
}

function getPartnerRank(guildId, points) {
  const partners =
    data.partners[guildId] || {};

  const ranking =
    Object.values(partners)
      .sort(
        (a, b) =>
          (b.points || 0) -
          (a.points || 0)
      );

  const position =
    ranking.findIndex(
      partner =>
        (partner.points || 0) <= points
    );

  return position === -1
    ? ranking.length + 1
    : position + 1;
}

// ======================================================
// TEMPLATES
// ======================================================

const WELCOME_TEMPLATE = `
👋・¡Bienvenido/a a LRM Studio!

¡Hey, $(user.mention)! Nos alegra tenerte por aquí. 💫

Esperamos que disfrutes tu estancia, conozcas gente nueva y formes parte de nuestra comunidad.

📌 Para comenzar:

📜 Lee las reglas del servidor.
🔔 Revisa nuestros anuncios y novedades.
🎭 Consigue tus roles.
💬 ¡Preséntate y comienza a hablar con la comunidad!

✨ Ya somos $(server.member_count) miembros en LRM Studio.

¡Gracias por unirte y esperamos que la pases genial! ❤️

— LRM Studio
`;

const GOODBYE_TEMPLATE = `
👋・Hasta pronto

$(user.mention) ha salido de LRM Studio. 💔

👥 Miembros: $(server.member_count)

¡Esperamos volver a verte pronto! ❤️
`;

const ALLIANCE_TEMPLATE = `
🤝・Nueva Alianza

Gracias $(invite.guild.name) por hacer alianza con LRM Studio. 💖

👤 Hecha por: $(user.mention)
🏆 Rank: #$(partner.rank)
⭐ Puntos: $(partner.points)

LRM Studio × $(invite.guild.name) 🤝
`;

const AFFY_TEMPLATE = `
💞・Nuevo Affy

$(user.mention) ahora es Affy de LRM Studio ✨

🤝 Servidor: $(invite.guild.name)
🏆 Rank: #$(partner.rank)
⭐ Puntos: $(partner.points)

LRM Studio × $(invite.guild.name) 💞
`;

const LOG_TYPES = [
  "messages",
  "members",
  "moderation",
  "channels",
  "roles",
  "server",
  "voice",
  "invites",
  "tickets",
  "levels",
  "suggestions",
  "alliance",
  "affy",
  "giveaways",
  "security",
  "commands"
];

// ======================================================
// REEMPLAZAR TEMPLATES
// ======================================================

function replaceTemplate(
  template,
  replacements
) {
  let result = template;

  for (
    const [key, value]
    of Object.entries(replacements)
  ) {
    result =
      result.replaceAll(
        key,
        String(value ?? "")
      );
  }

  return result.trim();
}

// ======================================================
// COMANDOS DE USUARIO
// ======================================================

const userCommands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "Muestra la ayuda de LRM Studio"
    ),

  new SlashCommandBuilder()
    .setName("utilidades")
    .setDescription(
      "Muestra las utilidades"
    ),

  new SlashCommandBuilder()
    .setName("perfil")
    .setDescription(
      "Muestra tu perfil"
    ),

  new SlashCommandBuilder()
    .setName("rank")
    .setDescription(
      "Muestra tu ranking"
    ),

  new SlashCommandBuilder()
    .setName("top")
    .setDescription(
      "Muestra el top de niveles"
    ),

  new SlashCommandBuilder()
    .setName("actividad")
    .setDescription(
      "Muestra tu actividad"
    ),

  new SlashCommandBuilder()
    .setName("logros")
    .setDescription(
      "Muestra tus logros"
    ),

  new SlashCommandBuilder()
    .setName("racha")
    .setDescription(
      "Muestra tu racha"
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription(
      "Muestra tu avatar"
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription(
      "Muestra información de un usuario"
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription(
      "Muestra información del servidor"
    ),

  new SlashCommandBuilder()
    .setName("membercount")
    .setDescription(
      "Muestra los miembros"
    ),

  new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription(
      "Información del bot"
    ),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription(
      "Muestra el ping"
    ),

  new SlashCommandBuilder()
    .setName("uptime")
    .setDescription(
      "Muestra el uptime"
    ),

  new SlashCommandBuilder()
    .setName("invitever")
    .setDescription(
      "Muestra tus invitaciones"
    ),

  new SlashCommandBuilder()
    .setName("sugerencia")
    .setDescription(
      "Envía una sugerencia"
    )
    .addStringOption(option =>
      option
        .setName("texto")
        .setDescription("Sugerencia")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("encuesta")
    .setDescription(
      "Crea una encuesta"
    )
    .addStringOption(option =>
      option
        .setName("pregunta")
        .setDescription("Pregunta")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("opciones")
        .setDescription(
          "Opciones separadas por |"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("recordatorio")
    .setDescription(
      "Crea un recordatorio"
    )
    .addStringOption(option =>
      option
        .setName("tiempo")
        .setDescription(
          "Ejemplo: 30m, 1h, 1d"
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("mensaje")
        .setDescription("Mensaje")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription(
      "Lanza una moneda"
    ),

  new SlashCommandBuilder()
    .setName("dice")
    .setDescription(
      "Lanza un dado"
    ),

  new SlashCommandBuilder()
    .setName("random")
    .setDescription(
      "Genera un número aleatorio"
    )
    .addIntegerOption(option =>
      option
        .setName("min")
        .setDescription("Mínimo")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("max")
        .setDescription("Máximo")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("choose")
    .setDescription(
      "Elige una opción"
    )
    .addStringOption(option =>
      option
        .setName("opciones")
        .setDescription(
          "Opciones separadas por comas"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("rps")
    .setDescription(
      "Piedra, papel o tijera"
    )
    .addStringOption(option =>
      option
        .setName("opcion")
        .setDescription("Tu elección")
        .setRequired(true)
        .addChoices(
          {
            name: "Piedra",
            value: "piedra"
          },
          {
            name: "Papel",
            value: "papel"
          },
          {
            name: "Tijera",
            value: "tijera"
          }
        )
    ),

  new SlashCommandBuilder()
    .setName("sorteo")
    .setDescription(
      "Crea un sorteo"
    )
    .addStringOption(option =>
      option
        .setName("mensaje")
        .setDescription("Premio o mensaje")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("tiempo")
        .setDescription(
          "Ejemplo: 30m, 1h, 1d"
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("requisitos")
        .setDescription(
          "Ejemplo: 3 invites o 50 mensajes"
        )
        .setRequired(false)
    )
];

// ======================================================
// COMANDOS ADMIN
// ======================================================

const adminCommands = [
  new SlashCommandBuilder()
    .setName("admin")
    .setDescription(
      "Abre el panel de administración"
    ),

  new SlashCommandBuilder()
    .setName("setbienvenida")
    .setDescription(
      "Configura el canal de bienvenida"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setdespedida")
    .setDescription(
      "Configura el canal de despedidas"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setinvitaciones")
    .setDescription(
      "Configura el canal de invitaciones"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setniveles")
    .setDescription(
      "Configura el canal de niveles"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setalianzas")
    .setDescription(
      "Configura el canal de alianzas"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setaffys")
    .setDescription(
      "Configura el canal de Affys"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setsugerencias")
    .setDescription(
      "Configura el canal de sugerencias"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setlogs")
    .setDescription(
      "Configura un canal de logs"
    )
    .addStringOption(option =>
      option
        .setName("tipo")
        .setDescription("Tipo de log")
        .setRequired(true)
        .addChoices(
          ...LOG_TYPES.map(type => ({
            name: type,
            value: type
          }))
        )
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setlogstodos")
    .setDescription(
      "Usa un canal para todos los logs"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("sethoneypot")
    .setDescription(
      "Configura el Honeypot"
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("setstaff")
    .setDescription(
      "Muestra el rol de staff configurado"
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription(
      "Banea a un usuario"
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription(
      "Expulsa a un usuario"
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription(
      "Silencia a un usuario"
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutos")
        .setDescription("Minutos")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription(
      "Advierte a un usuario"
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription(
      "Muestra las advertencias"
    )
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription(
      "Elimina mensajes"
    )
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("sorteos")
    .setDescription(
      "Administra sorteos"
    ),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription(
      "Publica el panel de tickets"
    )
];

// ======================================================
// TODAS LAS COMMANDS
// ======================================================

const allCommands = [
  ...userCommands,
  ...adminCommands
];

const commands =
  allCommands.map(
    command =>
      command.toJSON()
  );

// ======================================================
// MENÚ ADMIN
// ======================================================

function adminMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(
          "lrm_admin_menu"
        )
        .setPlaceholder(
          "Selecciona una categoría..."
        )
        .addOptions([
          {
            label: "Configuración",
            description:
              "Bienvenida, despedida, logs, alianzas...",
            value: "config",
            emoji: "🛠️"
          },
          {
            label: "Logs",
            description:
              "Sistema de registros",
            value: "logs",
            emoji: "📋"
          },
          {
            label: "Moderación",
            description:
              "Ban, kick, mute, warn...",
            value: "moderation",
            emoji: "🛡️"
          },
          {
            label: "Tickets",
            description:
              "Sistema de tickets",
            value: "tickets",
            emoji: "🎫"
          },
          {
            label: "Seguridad",
            description:
              "Anti-spam y Honeypot",
            value: "security",
            emoji: "🔐"
          },
          {
            label: "Sorteos",
            description:
              "Administrar sorteos",
            value: "giveaways",
            emoji: "🎉"
          }
        ])
    );
}

// ======================================================
// ADMIN EMBEDS
// ======================================================

function adminEmbed(category = "main") {
  if (category === "config") {
    return glassEmbed({
      title: "🛠️ Configuración",
      description:
        "`/setbienvenida`\n" +
        "`/setdespedida`\n" +
        "`/setinvitaciones`\n" +
        "`/setniveles`\n" +
        "`/setalianzas`\n" +
        "`/setaffys`\n" +
        "`/setsugerencias`\n" +
        "`/setlogs`\n" +
        "`/setlogstodos`\n" +
        "`/sethoneypot`",
      color: COLORS.admin
    });
  }

  if (category === "logs") {
    return glassEmbed({
      title: "📋 Sistema de Logs",
      description:
        "Los logs pueden separarse por categoría.\n\n" +
        LOG_TYPES
          .map(type => `• \`${type}\``)
          .join("\n") +
        "\n\nConfigura con `/setlogs`.",
      color: COLORS.info
    });
  }

  if (category === "moderation") {
    return glassEmbed({
      title: "🛡️ Moderación",
      description:
        "`/ban`\n" +
        "`/kick`\n" +
        "`/mute`\n" +
        "`/warn`\n" +
        "`/warnings`\n" +
        "`/purge`",
      color: COLORS.error
    });
  }

  if (category === "tickets") {
    return glassEmbed({
      title: "🎫 Tickets",
      description:
        "`/ticketpanel`\n\n" +
        "Los usuarios podrán abrir tickets desde el panel.",
      color: COLORS.primary
    });
  }

  if (category === "security") {
    return glassEmbed({
      title: "🔐 Seguridad",
      description:
        "🛡️ Anti-spam\n" +
        "🍯 Honeypot\n" +
        "⚠️ Advertencias automáticas\n" +
        "🔇 Mute automático",
      color: COLORS.security
    });
  }

  if (category === "giveaways") {
    return glassEmbed({
      title: "🎉 Sorteos",
      description:
        "`/sorteo`\n" +
        "`/sorteos`\n\n" +
        "Los sorteos pueden requerir mensajes o invitaciones.",
      color: COLORS.affy
    });
  }

  return glassEmbed({
    title: "⚙️ LRM Studio Admin",
    description:
      "Panel central de administración.\n\n" +
      "Selecciona una categoría del menú.",
    color: COLORS.admin
  });
}
// ======================================================
// MODERACIÓN
// ======================================================

function moderationTarget(
  guild,
  moderator,
  target
) {
  if (!target) {
    return "No encontré a ese usuario.";
  }

  if (
    target.id === guild.ownerId
  ) {
    return "No puedes moderar al dueño del servidor.";
  }

  if (
    target.id === moderator.id
  ) {
    return "No puedes moderarte a vos mismo.";
  }

  if (
    moderator.id !== guild.ownerId &&
    moderator.roles.highest.position <=
      target.roles.highest.position
  ) {
    return (
      "El rol del usuario está al mismo nivel o por encima del tuyo."
    );
  }

  const bot =
    guild.members.me;

  if (
    bot &&
    bot.roles.highest.position <=
      target.roles.highest.position
  ) {
    return (
      "Mi rol está por debajo del rol de ese usuario."
    );
  }

  return null;
}

async function addWarning(
  guild,
  userId,
  reason,
  moderatorId
) {
  const user =
    getUser(userId);

  user.warnings[guild.id] ??= [];

  user.warnings[guild.id].push({
    reason:
      reason || "Sin razón",
    moderator:
      moderatorId,
    timestamp:
      Date.now()
  });

  saveData();

  return user.warnings[guild.id].length;
}

// ======================================================
// PARSEAR TIEMPO
// ======================================================

function parseTime(value) {
  if (!value) return null;

  const match =
    String(value)
      .toLowerCase()
      .match(
        /^(\d+)\s*(s|m|h|d)$/
      );

  if (!match) return null;

  const amount =
    Number(match[1]);

  const unit =
    match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return (
    amount *
    multipliers[unit]
  );
}

// ======================================================
// DESPEDIDA
// ======================================================

client.on(
  "guildMemberRemove",
  async member => {
    try {
      const guild =
        member.guild;

      const settings =
        getGuildSettings(
          guild.id
        );

      if (
        settings.goodbyeChannel
      ) {
        const channel =
          guild.channels.cache.get(
            settings.goodbyeChannel
          );

        if (channel) {
          const text =
            replaceTemplate(
              `
👋・Hasta pronto

$(user.mention) ha salido de LRM Studio. 💔

👥 Miembros: $(server.member_count)

¡Esperamos volver a verte pronto! ❤️
              `,
              {
                "$(user.mention)":
                  `<@${member.id}>`,
                "$(server.member_count)":
                  guild.memberCount
              }
            );

          await channel.send({
            embeds: [
              glassEmbed({
                title:
                  "👋・Hasta pronto",
                description:
                  text,
                color:
                  COLORS.warning
              })
            ]
          });
        }
      }

      await logAction(
        guild,
        "members",
        "👋 Miembro salió",
        `<@${member.id}> salió del servidor.\n\n` +
        `👥 Miembros: **${guild.memberCount}**`
      );

    } catch (error) {
      console.error(
        "Error guildMemberRemove:",
        error
      );
    }
  }
);

// ======================================================
// NUEVO MIEMBRO
// ======================================================

client.on(
  "guildMemberAdd",
  async member => {
    try {
      const guild =
        member.guild;

      const settings =
        getGuildSettings(
          guild.id
        );

      // --------------------------------------------------
      // BIENVENIDA
      // --------------------------------------------------

      if (
        settings.welcomeChannel
      ) {
        const channel =
          guild.channels.cache.get(
            settings.welcomeChannel
          );

        if (channel) {
          const text =
            replaceTemplate(
              `
👋・¡Bienvenido/a a LRM Studio!

¡Hey, $(user.mention)! Nos alegra tenerte por aquí. 💫

Esperamos que disfrutes tu estancia, conozcas gente nueva y formes parte de nuestra comunidad.

✨ Ya somos $(server.member_count) miembros en LRM Studio.

¡Gracias por unirte y esperamos que la pases genial! ❤️

— LRM Studio
              `,
              {
                "$(user.mention)":
                  `${member}`,
                "$(server.member_count)":
                  guild.memberCount
              }
            );

          await channel.send({
            embeds: [
              glassEmbed({
                title:
                  "👋・Bienvenido/a",
                description:
                  text,
                color:
                  COLORS.primary
              })
            ]
          });
        }
      }

      // --------------------------------------------------
      // INVITACIÓN UTILIZADA
      // --------------------------------------------------

      const invite =
        await findUsedInvite(
          guild
        );

      if (
        invite &&
        invite.inviter
      ) {
        data.inviteSystem[
          guild.id
        ] ??= {};

        data.inviteSystem[
          guild.id
        ][
          invite.inviter.id
        ] ??= {
          invites: 0
        };

        data.inviteSystem[
          guild.id
        ][
          invite.inviter.id
        ].invites++;

        saveData();

        if (
          settings.inviteChannel
        ) {
          const channel =
            guild.channels.cache.get(
              settings.inviteChannel
            );

          if (channel) {
            await channel.send({
              embeds: [
                glassEmbed({
                  title:
                    "🔗・Nueva Invitación",
                  description:
                    `👤 Invitador: ${invite.inviter}\n` +
                    `📨 Invitaciones: **${
                      data.inviteSystem[
                        guild.id
                      ][
                        invite.inviter.id
                      ].invites
                    }**\n` +
                    `👥 Miembros: **${guild.memberCount}**`,
                  color:
                    COLORS.info
                })
              ]
            });
          }
        }

        await logAction(
          guild,
          "invites",
          "📨 Invitación utilizada",
          `${member} entró mediante una invitación de ${invite.inviter}.`
        );
      }

      await logAction(
        guild,
        "members",
        "📥 Nuevo miembro",
        `${member} entró al servidor.\n\n` +
        `👥 Miembros: **${guild.memberCount}**`
      );

    } catch (error) {
      console.error(
        "Error guildMemberAdd:",
        error
      );
    }
  }
);

// ======================================================
// ANTI-SPAM
// ======================================================

client.on(
  "messageCreate",
  async message => {
    if (
      message.author.bot ||
      !message.guild
    ) {
      return;
    }

    const settings =
      getGuildSettings(
        message.guild.id
      );

    if (
      !settings.antiSpamEnabled
    ) {
      return;
    }

    const user =
      getUser(
        message.author.id
      );

    user.messages++;

    data.antiSpam[
      message.guild.id
    ] ??= {};

    data.antiSpam[
      message.guild.id
    ][
      message.author.id
    ] ??= {
      messages: [],
      warnings: 0
    };

    const spam =
      data.antiSpam[
        message.guild.id
      ][
        message.author.id
      ];

    const now =
      Date.now();

    spam.messages =
      spam.messages.filter(
        timestamp =>
          now - timestamp <
          15000
      );

    spam.messages.push(now);

    if (
      spam.messages.length >= 5
    ) {
      spam.messages = [];

      const warnings =
        await addWarning(
          message.guild,
          message.author.id,
          "Anti-spam: 5 mensajes seguidos",
          client.user.id
        );

      spam.warnings = warnings;

      await message.channel.send({
        embeds: [
          glassEmbed({
            title:
              "⚠️ Advertencia por spam",
            description:
              `${message.author} recibió una advertencia.\n\n` +
              `⚠️ Advertencias: **${warnings}/3**\n\n` +
              `5 mensajes seguidos detectados.`,
            color:
              COLORS.warning
          })
        ]
      }).catch(() => {});

      await logAction(
        message.guild,
        "security",
        "⚠️ Anti-spam",
        `${message.author} recibió una advertencia por enviar 5 mensajes seguidos.`,
        COLORS.warning
      );

      if (
        warnings >= 3
      ) {
        const member =
          message.member;

        if (
          member &&
          member.moderatable
        ) {
          await member.timeout(
            60 * 60 * 1000,
            "3 advertencias por anti-spam"
          ).catch(() => {});

          await message.channel.send({
            embeds: [
              glassEmbed({
                title:
                  "🔇 Mute automático",
                description:
                  `${message.author} recibió un mute de **1 hora** por alcanzar 3 advertencias de anti-spam.`,
                color:
                  COLORS.error
              })
            ]
          }).catch(() => {});

          await logAction(
            message.guild,
            "moderation",
            "🔇 Mute automático",
            `${message.author} fue muteado durante 1 hora por alcanzar 3 advertencias de anti-spam.`,
            COLORS.error
          );
        }
      }
    }
  }
);

// ======================================================
// MENSAJES — PREFIX + XP + AFFY
// ======================================================

client.on(
  "messageCreate",
  async message => {
    if (
      message.author.bot ||
      !message.guild
    ) {
      return;
    }

    const content =
      message.content.trim();

    // --------------------------------------------------
    // XP
    // --------------------------------------------------

    await addXP(
      message.author.id,
      random(3, 8),
      message.guild
    );

    // --------------------------------------------------
    // PREFIJO
    // --------------------------------------------------

    if (
      !content.startsWith(PREFIX)
    ) {
      return;
    }

    const args =
      content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/);

    const command =
      args
        .shift()
        ?.toLowerCase();

    // --------------------------------------------------
    // AFFY
    // --------------------------------------------------

    if (
      command === "affy"
    ) {
      const url =
        args.find(
          arg =>
            /discord(?:\.gg|\.com\/invite)\//i
              .test(arg)
        );

      if (!url) {
        return message.reply({
          embeds: [
            errorEmbed(
              "Debes colocar una invitación de Discord.\n\n" +
              "Ejemplo:\n`.affy https://discord.gg/ejemplo`"
            )
          ]
        });
      }

      try {
        const invite =
          await client.fetchInvite(
            url
          );

        if (
          !invite.guild
        ) {
          return message.reply({
            embeds: [
              errorEmbed(
                "No pude obtener el servidor de esa invitación."
              )
            ]
          });
        }

        const partner =
          getPartner(
            message.guild.id,
            invite.guild.id,
            invite.guild.name
          );

        partner.points++;
        partner.invites++;

        saveData();

        const rank =
          getPartnerRank(
            message.guild.id,
            partner.points
          );

        const text =
          replaceTemplate(
            `
💞・Nuevo Affy

$(user.mention) ahora es Affy de LRM Studio ✨

🤝 Servidor: $(invite.guild.name)
🏆 Rank: #$(partner.rank)
⭐ Puntos: $(partner.points)

LRM Studio × $(invite.guild.name) 💞
            `,
            {
              "$(user.mention)":
                `${message.author}`,
              "$(invite.guild.name)":
                invite.guild.name,
              "$(partner.rank)":
                rank,
              "$(partner.points)":
                partner.points
            }
          );

        const settings =
          getGuildSettings(
            message.guild.id
          );

        const channel =
          settings.affysChannel
            ? message.guild.channels.cache.get(
                settings.affysChannel
              )
            : null;

        if (!channel) {
          return message.reply({
            embeds: [
              errorEmbed(
                "No hay un canal de Affys configurado.\nUsa `/setaffys`."
              )
            ]
          });
        }

        await channel.send({
          content:
            "@everyone",
          embeds: [
            glassEmbed({
              title:
                "💞・Nuevo Affy",
              description:
                text,
              color:
                COLORS.affy
            })
          ],
          allowedMentions: {
            parse: [
              "everyone"
            ]
          }
        });

        await logAction(
          message.guild,
          "affy",
          "💞 Nuevo Affy",
          `${message.author} publicó un Affy con **${invite.guild.name}**.`,
          COLORS.affy
        );

        return message.reply({
          embeds: [
            successEmbed(
              `El Affy con **${invite.guild.name}** fue publicado correctamente.`
            )
          ]
        });

      } catch (error) {
        console.error(
          "Error Affy:",
          error
        );

        return message.reply({
          embeds: [
            errorEmbed(
              "La invitación no es válida o no pude acceder a ella."
            )
          ]
        });
      }
    }

    // --------------------------------------------------
    // HELP
    // --------------------------------------------------

    if (
      command === "help"
    ) {
      return message.reply({
        embeds: [
          glassEmbed({
            title:
              "📚 LRM Studio",
            description:
              "Usa `/help` para consultar todos los comandos.",
            color:
              COLORS.primary
          })
        ]
      });
    }

    // --------------------------------------------------
    // ADMIN
    // --------------------------------------------------

    if (
      command === "admin"
    ) {
      if (
        !isAdmin(
          message.member
        )
      ) {
        return message.reply({
          embeds: [
            errorEmbed(
              "Solo los administradores pueden abrir este panel."
            )
          ]
        });
      }

      return message.reply({
        embeds: [
          adminEmbed()
        ],
        components: [
          adminMenu()
        ]
      });
    }

    // --------------------------------------------------
    // PING
    // --------------------------------------------------

    if (
      command === "ping"
    ) {
      return message.reply({
        embeds: [
          glassEmbed({
            title:
              "🏓 Pong",
            description:
              `WebSocket: **${client.ws.ping}ms**`,
            color:
              COLORS.success
          })
        ]
      });
    }
  }
);

// ======================================================
// INTERACCIONES
// ======================================================

client.on(
  "interactionCreate",
  async interaction => {
    try {

      // ==================================================
      // ADMIN MENU
      // ==================================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          "lrm_admin_menu"
      ) {
        if (
          !isAdmin(
            interaction.member
          )
        ) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                "No tienes permiso para usar este panel."
              )
            ],
            ephemeral: true
          });
        }

        return interaction.update({
          embeds: [
            adminEmbed(
              interaction.values[0]
            )
          ],
          components: [
            adminMenu()
          ]
        });
      }

      // ==================================================
      // ADMIN SLASH
      // ==================================================

      if (
        interaction.isChatInputCommand() &&
        adminCommands.some(
          command =>
            command.name ===
            interaction.commandName
        )
      ) {
        return executeAdminCommand(
          interaction
        );
      }

      // ==================================================
      // USER SLASH
      // ==================================================

      if (
        interaction.isChatInputCommand()
      ) {
        return executeUserCommand(
          interaction
        );
      }

    } catch (error) {
      console.error(
        "Error interactionCreate:",
        error
      );

      const response = {
        embeds: [
          errorEmbed(
            "Ocurrió un error ejecutando esta interacción."
          )
        ],
        ephemeral: true
      };

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        return interaction
          .followUp(response)
          .catch(() => {});
      }

      return interaction
        .reply(response)
        .catch(() => {});
    }
  }
);

// ======================================================
// EJECUTAR ADMIN
// ======================================================

async function executeAdminCommand(
  interaction
) {
  if (
    !interaction.guild
  ) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Este comando solo funciona dentro de un servidor."
        )
      ],
      ephemeral: true
    });
  }

  if (
    !isAdmin(
      interaction.member
    )
  ) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Solo los administradores pueden usar este comando."
        )
      ],
      ephemeral: true
    });
  }

  const command =
    interaction.commandName;

  const settings =
    getGuildSettings(
      interaction.guild.id
    );

  // ==================================================
  // ADMIN
  // ==================================================

  if (
    command === "admin"
  ) {
    return interaction.reply({
      embeds: [
        adminEmbed()
      ],
      components: [
        adminMenu()
      ]
    });
  }

  // ==================================================
  // CONFIGURACIONES
  // ==================================================

  const configMap = {
    setbienvenida:
      "welcomeChannel",
    setdespedida:
      "goodbyeChannel",
    setinvitaciones:
      "inviteChannel",
    setniveles:
      "levelChannel",
    setalianzas:
      "allianceChannel",
    setaffys:
      "affysChannel",
    setsugerencias:
      "suggestionChannel"
  };

  if (
    configMap[command]
  ) {
    const channel =
      interaction.options.getChannel(
        "canal"
      );

    settings[
      configMap[command]
    ] = channel.id;

    saveData();

    await logAction(
      interaction.guild,
      "commands",
      "⚙️ Configuración modificada",
      `${interaction.user} configuró **${command}** → ${channel}.`
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `Configuración guardada.\n\n📌 Canal: ${channel}`
        )
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // SET LOGS
  // ==================================================

  if (
    command === "setlogs"
  ) {
    const type =
      interaction.options.getString(
        "tipo"
      );

    const channel =
      interaction.options.getChannel(
        "canal"
      );

    settings.logChannels[type] =
      channel.id;

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `El log **${type}** ahora se enviará en ${channel}.`
        )
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // TODOS LOS LOGS
  // ==================================================

  if (
    command === "setlogstodos"
  ) {
    const channel =
      interaction.options.getChannel(
        "canal"
      );

    settings.logChannels ??= {};

    for (
      const type
      of LOG_TYPES
    ) {
      settings.logChannels[type] =
        channel.id;
    }

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Todos los logs fueron configurados en ${channel}.`
        )
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // SET STAFF
  // ==================================================

  if (
    command === "setstaff"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "👮 Staff",
          description:
            `El sistema utiliza el rol configurado:\n\n<@&${ALLIANCE_ROLE_ID}>`,
          color:
            COLORS.admin
        })
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // BAN
  // ==================================================

  if (
    command === "ban"
  ) {
    const user =
      interaction.options.getUser(
        "usuario"
      );

    const reason =
      interaction.options.getString(
        "razon"
      ) ||
      "Sin razón";

    const member =
      await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

    if (member) {
      const check =
        moderationTarget(
          interaction.guild,
          interaction.member,
          member
        );

      if (check) {
        return interaction.reply({
          embeds: [
            errorEmbed(check)
          ],
          ephemeral: true
        });
      }
    }

    await interaction.guild.members.ban(
      user.id,
      {
        reason
      }
    );

    await logAction(
      interaction.guild,
      "moderation",
      "🔨 Usuario baneado",
      `${user} fue baneado por ${interaction.user}.\n\n` +
      `📝 Razón: **${reason}**`,
      COLORS.error
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `${user} fue baneado correctamente.`
        )
      ]
    });
  }

  // ==================================================
  // KICK
  // ==================================================

  if (
    command === "kick"
  ) {
    const user =
      interaction.options.getUser(
        "usuario"
      );

    const reason =
      interaction.options.getString(
        "razon"
      ) ||
      "Sin razón";

    const member =
      await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No encontré al usuario en el servidor."
          )
        ],
        ephemeral: true
      });
    }

    const check =
      moderationTarget(
        interaction.guild,
        interaction.member,
        member
      );

    if (check) {
      return interaction.reply({
        embeds: [
          errorEmbed(check)
        ],
        ephemeral: true
      });
    }

    await member.kick(
      reason
    );

    await logAction(
      interaction.guild,
      "moderation",
      "👢 Usuario expulsado",
      `${user} fue expulsado por ${interaction.user}.\n\n` +
      `📝 Razón: **${reason}**`,
      COLORS.error
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `${user} fue expulsado correctamente.`
        )
      ]
    });
  }

  // ==================================================
  // MUTE
  // ==================================================

  if (
    command === "mute"
  ) {
    const user =
      interaction.options.getUser(
        "usuario"
      );

    const minutes =
      interaction.options.getInteger(
        "minutos"
      ) || 60;

    const reason =
      interaction.options.getString(
        "razon"
      ) ||
      "Sin razón";

    const member =
      await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No encontré al usuario."
          )
        ],
        ephemeral: true
      });
    }

    const check =
      moderationTarget(
        interaction.guild,
        interaction.member,
        member
      );

    if (check) {
      return interaction.reply({
        embeds: [
          errorEmbed(check)
        ],
        ephemeral: true
      });
    }

    await member.timeout(
      minutes * 60 * 1000,
      reason
    );

    await logAction(
      interaction.guild,
      "moderation",
      "🔇 Usuario muteado",
      `${user} fue muteado por **${minutes} minutos**.\n\n` +
      `📝 Razón: **${reason}**`,
      COLORS.error
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `${user} fue muteado durante **${minutes} minutos**.`
        )
      ]
    });
  }

  // ==================================================
  // WARN
  // ==================================================

  if (
    command === "warn"
  ) {
    const user =
      interaction.options.getUser(
        "usuario"
      );

    const reason =
      interaction.options.getString(
        "razon"
      ) ||
      "Sin razón";

    const member =
      await interaction.guild.members
        .fetch(user.id
        )
        .catch(() => null);

    if (member) {
      const check =
        moderationTarget(
          interaction.guild,
          interaction.member,
          member
        );

      if (check) {
        return interaction.reply({
          embeds: [
            errorEmbed(check)
          ],
          ephemeral: true
        });
      }
    }

    const count =
      await addWarning(
        interaction.guild,
        user.id,
        reason,
        interaction.user.id
      );

    await logAction(
      interaction.guild,
      "moderation",
      "⚠️ Advertencia",
      `${user} recibió una advertencia de ${interaction.user}.\n\n` +
      `📝 Razón: **${reason}**\n` +
      `⚠️ Total: **${count}**`,
      COLORS.warning
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `${user} recibió una advertencia.\n\n` +
          `⚠️ Total: **${count}**`
        )
      ]
    });
  }

  // ==================================================
  // WARNINGS
  // ==================================================

  if (
    command === "warnings"
  ) {
    const user =
      interaction.options.getUser(
        "usuario"
      );

    const profile =
      getUser(
        user.id
      );

    const warnings =
      profile.warnings[
        interaction.guild.id
      ] || [];

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "⚠️ Advertencias",
          description:
            `${user}\n\n` +
            (
              warnings.length
                ? warnings
                    .map(
                      (warning, index) =>
                        `**${index + 1}.** ${warning.reason}`
                    )
                    .join("\n")
                : "No tiene advertencias."
            ),
          color:
            COLORS.warning
        })
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // PURGE
  // ==================================================

  if (
    command === "purge"
  ) {
    const amount =
      interaction.options.getInteger(
        "cantidad"
      );

    if (
      amount < 1 ||
      amount > 100
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "La cantidad debe estar entre 1 y 100."
          )
        ],
        ephemeral: true
      });
    }

    const deleted =
      await interaction.channel.bulkDelete(
        amount,
        true
      );

    await logAction(
      interaction.guild,
      "moderation",
      "🧹 Mensajes eliminados",
      `${interaction.user} eliminó **${deleted.size} mensajes** en ${interaction.channel}.`
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `Se eliminaron **${deleted.size} mensajes**.`
        )
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // HONEYPOT
  // ==================================================

  if (
    command === "sethoneypot"
  ) {
    const channel =
      interaction.options.getChannel(
        "canal"
      );

    settings.honeypotChannel =
      channel.id;

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `🍯 Honeypot configurado en ${channel}.`
        )
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // TICKET PANEL
  // ==================================================

  if (
    command === "ticketpanel"
  ) {
    const channel =
      settings.ticketChannel
        ? interaction.guild.channels.cache.get(
            settings.ticketChannel
          )
        : interaction.channel;

    const button =
      new ButtonBuilder()
        .setCustomId(
          "lrm_ticket_open"
        )
        .setLabel(
          "Abrir Ticket"
        )
        .setEmoji("🎫")
        .setStyle(
          ButtonStyle.Primary
        );

    await channel.send({
      embeds: [
        glassEmbed({
          title:
            "🎫・Soporte LRM Studio",
          description:
            "¿Necesitas ayuda?\n\n" +
            "Presiona el botón para abrir un ticket.",
          color:
            COLORS.primary
        })
      ],
      components: [
        new ActionRowBuilder()
          .addComponents(
            button
          )
      ]
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `Panel enviado en ${channel}.`
        )
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // SORTEOS
  // ==================================================

  if (
    command === "sorteos"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🎉 Sorteos",
          description:
            "Usa `/sorteo` para crear un sorteo.\n\n" +
            "Los sorteos activos se guardan en `data.json`.",
          color:
            COLORS.affy
        })
      ],
      ephemeral: true
    });
  }

  return interaction.reply({
    embeds: [
      errorEmbed(
        "Comando administrativo no encontrado."
      )
    ],
    ephemeral: true
  });
}

// ======================================================
// COMANDOS DE USUARIO
// ======================================================

async function executeUserCommand(
  interaction
) {
  const command =
    interaction.commandName;

  const user =
    getUser(
      interaction.user.id
    );

  // ==================================================
  // HELP
  // ==================================================

  if (
    command === "help"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "📚 LRM Studio",
          description:
            "Comandos disponibles:",
          fields: [
            {
              name:
                "👤 Usuario",
              value:
                "`/perfil` `/avatar` `/userinfo` `/actividad` `/logros` `/racha`"
            },
            {
              name:
                "📊 Comunidad",
              value:
                "`/rank` `/top` `/sugerencia` `/encuesta` `/recordatorio`"
            },
            {
              name:
                "🎮 Diversión",
              value:
                "`/coinflip` `/dice` `/random` `/choose` `/rps`"
            },
            {
              name:
                "ℹ️ Información",
              value:
                "`/ping` `/botinfo` `/serverinfo` `/membercount` `/uptime` `/invitever`"
            },
            {
              name:
                "🎉 Eventos",
              value:
                "`/sorteo`"
            }
          ],
          color:
            COLORS.primary
        })
      ]
    });
  }

  // ==================================================
  // PERFIL
  // ==================================================

  if (
    command === "perfil"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "👤 Perfil",
          description:
            `${interaction.user}\n\n` +
            `✦ Nivel: **${user.level}**\n` +
            `⭐ XP: **${user.xp}**\n` +
            `💬 Mensajes: **${user.messages}**\n` +
            `🔥 Racha: **${user.streak}**`,
          color:
            COLORS.primary
        })
      ]
    });
  }

  // ==================================================
  // RANK
  // ==================================================

  if (
    command === "rank"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🏆 Ranking",
          description:
            `${interaction.user}\n\n` +
            `🏆 Posición: **#${getRank(
              interaction.guild,
              interaction.user.id
            )}**\n` +
            `✦ Nivel: **${user.level}**\n` +
            `⭐ XP: **${user.xp}**`,
          color:
            COLORS.level
        })
      ]
    });
  }

  // ==================================================
  // TOP
  // ==================================================

  if (
    command === "top"
  ) {
    const ranking =
      Object.entries(
        data.users
      )
        .sort(
          (a, b) =>
            (b[1].xp || 0) -
            (a[1].xp || 0)
        )
        .slice(0, 10);

    const text =
      ranking.length
        ? ranking
            .map(
              ([id, profile], index) =>
                `**#${index + 1}** <@${id}> — Nivel **${profile.level || 1}** · ${profile.xp || 0} XP`
            )
            .join("\n")
        : "Todavía no hay datos.";

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🏆 Top LRM Studio",
          description:
            text,
          color:
            COLORS.level
        })
      ]
    });
  }

  // ==================================================
  // ACTIVIDAD
  // ==================================================

  if (
    command === "actividad"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "📊 Tu actividad",
          description:
            `${interaction.user}\n\n` +
            `💬 Mensajes: **${user.messages}**\n` +
            `✦ Nivel: **${user.level}**\n` +
            `⭐ XP: **${user.xp}**\n` +
            `🔥 Racha: **${user.streak} días**`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // LOGROS
  // ==================================================

  if (
    command === "logros"
  ) {
    const achievements =
      user.achievements || [];

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🏆 Logros",
          description:
            achievements.length
              ? achievements
                  .map(
                    item =>
                      `🏆 ${item}`
                  )
                  .join("\n")
              : "Todavía no tienes logros desbloqueados.",
          color:
            COLORS.warning
        })
      ]
    });
  }

  // ==================================================
  // RACHA
  // ==================================================

  if (
    command === "racha"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🔥 Racha",
          description:
            `${interaction.user}\n\n` +
            `🔥 Racha actual: **${user.streak} días**`,
          color:
            COLORS.warning
        })
      ]
    });
  }

  // ==================================================
  // AVATAR
  // ==================================================

  if (
    command === "avatar"
  ) {
    const target =
      interaction.options.getUser(
        "usuario"
      ) ||
      interaction.user;

    const avatar =
      target.displayAvatarURL({
        size: 4096,
        extension: "png"
      });

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🖼️ Avatar",
          description:
            `[Abrir avatar completo](${avatar})`,
          color:
            COLORS.info,
          image:
            avatar
        })
      ]
    });
  }

  // ==================================================
  // USERINFO
  // ==================================================

  if (
    command === "userinfo"
  ) {
    const target =
      interaction.options.getUser(
        "usuario"
      ) ||
      interaction.user;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "👤 User Info",
          description:
            `👤 Usuario: ${target}\n` +
            `🏷️ Tag: **${target.tag}**\n` +
            `🆔 ID: \`${target.id}\`\n` +
            `🤖 Bot: **${target.bot ? "Sí" : "No"}**\n` +
            `📅 Cuenta: <t:${Math.floor(
              target.createdTimestamp / 1000
            )}:R>`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // SERVERINFO
  // ==================================================

  if (
    command === "serverinfo"
  ) {
    const guild =
      interaction.guild;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🖥️ Server Info",
          description:
            `🏠 **${guild.name}**\n` +
            `🆔 \`${guild.id}\`\n` +
            `👥 Miembros: **${guild.memberCount}**\n` +
            `👑 Owner: <@${guild.ownerId}>\n` +
            `📅 Creado: <t:${Math.floor(
              guild.createdTimestamp / 1000
            )}:R>`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // MEMBERCOUNT
  // ==================================================

  if (
    command === "membercount"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "👥 Miembros",
          description:
            `Este servidor tiene **${interaction.guild.memberCount} miembros**.`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // BOTINFO
  // ==================================================

  if (
    command === "botinfo"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🤖 LRM Studio",
          description:
            `🌐 Servidores: **${client.guilds.cache.size}**\n` +
            `👥 Usuarios: **${client.users.cache.size}**\n` +
            `⚙️ Discord.js: **14.x**`,
          color:
            COLORS.primary
        })
      ]
    });
  }

  // ==================================================
  // PING
  // ==================================================

  if (
    command === "ping"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🏓 Pong",
          description:
            `WebSocket: **${client.ws.ping}ms**`,
          color:
            COLORS.success
        })
      ]
    });
  }

  // ==================================================
  // UPTIME
  // ==================================================

  if (
    command === "uptime"
  ) {
    const total =
      Math.floor(
        client.uptime / 1000
      );

    const days =
      Math.floor(
        total / 86400
      );

    const hours =
      Math.floor(
        (total % 86400) / 3600
      );

    const minutes =
      Math.floor(
        (total % 3600) / 60
      );

    const seconds =
      total % 60;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "⏱️ Uptime",
          description:
            `🟢 **${days}d ${hours}h ${minutes}m ${seconds}s**`,
          color:
            COLORS.success
        })
      ]
    });
  }

  // ==================================================
  // INVITEVER
  // ==================================================

  if (
    command === "invitever"
  ) {
    const invites =
      data.inviteSystem
        ?.[interaction.guild.id]
        ?.[interaction.user.id]
        ?.invites || 0;

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "📨 Invitaciones",
          description:
            `${interaction.user}\n\n` +
            `📨 Invitaciones: **${invites}**`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // SUGERENCIA
  // ==================================================

  if (
    command === "sugerencia"
  ) {
    const text =
      interaction.options.getString(
        "texto"
      );

    const settings =
      getGuildSettings(
        interaction.guild.id
      );

    const channel =
      settings.suggestionChannel
        ? interaction.guild.channels.cache.get(
            settings.suggestionChannel
          )
        : null;

    const embed =
      glassEmbed({
        title:
          "💡・Nueva sugerencia",
        description:
          `${interaction.user}\n\n> ${text}`,
        color:
          COLORS.warning
      });

    if (channel) {
      await channel.send({
        embeds: [embed]
      });

      await logAction(
        interaction.guild,
        "suggestions",
        "💡 Sugerencia",
        `${interaction.user} envió una sugerencia.`
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            "Tu sugerencia fue enviada correctamente."
          )
        ],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [embed]
    });
  }

  // ==================================================
  // ENCUESTA
  // ==================================================

  if (
    command === "encuesta"
  ) {
    const question =
      interaction.options.getString(
        "pregunta"
      );

    const raw =
      interaction.options.getString(
        "opciones"
      );

    const options =
      raw
        .split("|")
        .map(
          x => x.trim()
        )
        .filter(Boolean)
        .slice(0, 5);

    if (
      options.length < 2
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Necesitas al menos 2 opciones separadas por `|`."
          )
        ],
        ephemeral: true
      });
    }

    const letters = [
      "🇦",
      "🇧",
      "🇨",
      "🇩",
      "🇪"
    ];

    const embed =
      glassEmbed({
        title:
          "📊・Encuesta",
        description:
          `**${question}**\n\n` +
          options
            .map(
              (option, index) =>
                `${letters[index]} ${option}`
            )
            .join("\n"),
        color:
          COLORS.info
      });

    const sent =
      await interaction.channel.send({
        embeds: [embed]
      });

    for (
      let i = 0;
      i < options.length;
      i++
    ) {
      await sent.react(
        letters[i]
      ).catch(() => {});
    }

    return interaction.reply({
      embeds: [
        successEmbed(
          "Encuesta creada correctamente."
        )
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // RECORDATORIO
  // ==================================================

  if (
    command === "recordatorio"
  ) {
    const time =
      interaction.options.getString(
        "tiempo"
      );

    const text =
      interaction.options.getString(
        "mensaje"
      );

    const milliseconds =
      parseTime(time);

    if (
      !milliseconds
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Tiempo inválido. Usa formatos como `30m`, `1h` o `1d`."
          )
        ],
        ephemeral: true
      });
    }

    if (
      milliseconds >
      7 * 24 * 60 * 60 * 1000
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "El máximo es 7 días."
          )
        ],
        ephemeral: true
      });
    }

    const id =
      `${interaction.user.id}-${Date.now()}`;

    data.reminders[id] = {
      userId:
        interaction.user.id,
      channelId:
        interaction.channel.id,
      guildId:
        interaction.guild.id,
      message:
        text,
      executeAt:
        Date.now() + milliseconds
    };

    saveData();

    setTimeout(
      async () => {
        const reminder =
          data.reminders[id];

        if (!reminder) return;

        const channel =
          interaction.guild.channels.cache.get(
            reminder.channelId
          );

        if (channel) {
          await channel.send({
            content:
              `<@${reminder.userId}>`,
            embeds: [
              glassEmbed({
                title:
                  "⏰・Recordatorio",
                description:
                  reminder.message,
                color:
                  COLORS.warning
              })
            ]
          }).catch(() => {});
        }

        delete data.reminders[id];
        saveData();
      },
      milliseconds
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `Recordatorio creado para dentro de **${time}**.`
        )
      ],
      ephemeral: true
    });
  }

  // ==================================================
  // COINFLIP
  // ==================================================

  if (
    command === "coinflip"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🪙 Coinflip",
          description:
            `Resultado: **${
              Math.random() < 0.5
                ? "Cara"
                : "Cruz"
            }**`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // DICE
  // ==================================================

  if (
    command === "dice"
  ) {
    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🎲 Dado",
          description:
            `Resultado: **${random(1, 6)}**`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // RANDOM
  // ==================================================

  if (
    command === "random"
  ) {
    const min =
      interaction.options.getInteger(
        "min"
      );

    const max =
      interaction.options.getInteger(
        "max"
      );

    if (
      min > max
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "El mínimo no puede ser mayor que el máximo."
          )
        ],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🎲 Random",
          description:
            `Resultado: **${random(min, max)}**`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // CHOOSE
  // ==================================================

  if (
    command === "choose"
  ) {
    const raw =
      interaction.options.getString(
        "opciones"
      );

    const options =
      raw
        .split(",")
        .map(
          x => x.trim()
        )
        .filter(Boolean);

    if (
      options.length < 2
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Necesitas al menos 2 opciones."
          )
        ],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "🎯 Choose",
          description:
            `Elegí:\n\n> **${
              options[
                random(
                  0,
                  options.length - 1
                )
              ]
            }**`,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // RPS
  // ==================================================

  if (
    command === "rps"
  ) {
    const player =
      interaction.options.getString(
        "opcion"
      );

    const choices = [
      "piedra",
      "papel",
      "tijera"
    ];

    const bot =
      choices[
        random(0, 2)
      ];

    let result;

    if (
      player === bot
    ) {
      result =
        "🤝 Empate.";
    } else if (
      (
        player === "piedra" &&
        bot === "tijera"
      ) ||
      (
        player === "papel" &&
        bot === "piedra"
      ) ||
      (
        player === "tijera" &&
        bot === "papel"
      )
    ) {
      result =
        "🏆 Ganaste.";
    } else {
      result =
        "🤖 Gané yo.";
    }

    return interaction.reply({
      embeds: [
        glassEmbed({
          title:
            "✊ Piedra, Papel o Tijera",
          description:
            `👤 **${player}**\n` +
            `🤖 **${bot}**\n\n` +
            result,
          color:
            COLORS.info
        })
      ]
    });
  }

  // ==================================================
  // SORTEO
  // ==================================================

  if (
    command === "sorteo"
  ) {
    if (
      !isStaff(
        interaction.member
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Solo el staff puede crear sorteos."
          )
        ],
        ephemeral: true
      });
    }

    const message =
      interaction.options.getString(
        "mensaje"
      );

    const time =
      interaction.options.getString(
        "tiempo"
      );

    const requirements =
      interaction.options.getString(
        "requisitos"
      ) || "Sin requisitos";

    const duration =
      parseTime(time);

    if (!duration) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Tiempo inválido. Usa `30m`, `1h`, `1d`, etc."
          )
        ],
        ephemeral: true
      });
    }

    if (
      duration >
      30 * 24 * 60 * 60 * 1000
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "El máximo de duración es 30 días."
          )
        ],
        ephemeral: true
      });
    }

    const id =
      `${interaction.guild.id}-${Date.now()}`;

    const giveaway = {
      id,
      guildId:
        interaction.guild.id,
      channelId:
        interaction.channel.id,
      message,
      requirements,
      hostId:
        interaction.user.id,
      endsAt:
        Date.now() + duration,
      ended: false,
      participants: []
    };

    data.giveaways[id] =
      giveaway;

    saveData();

    const button =
      new ButtonBuilder()
        .setCustomId(
          `giveaway_join_${id}`
        )
        .setLabel(
          "Participar"
        )
        .setEmoji("🎉")
        .setStyle(
          ButtonStyle.Primary
        );

    const embed =
      glassEmbed({
        title:
          "🎉・Sorteo",
        description:
          `${message}\n\n` +
          `⏱️ Termina: <t:${Math.floor(
            giveaway.endsAt / 1000
          )}:R>\n` +
          `📋 Requisitos: **${requirements}**\n\n` +
          `👤 Organizado por: ${interaction.user}`,
        color:
          COLORS.affy
      });

    const sent =
      await interaction.channel.send({
        embeds: [embed],
        components: [
          new ActionRowBuilder()
            .addComponents(
              button
            )
        ]
      });

    giveaway.messageId =
      sent.id;

    saveData();

    await logAction(
      interaction.guild,
      "giveaways",
      "🎉 Sorteo creado",
      `${interaction.user} creó un sorteo.\n\n` +
      `🎁 ${message}\n` +
      `📋 Requisitos: ${requirements}`
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          "Sorteo creado correctamente."
        )
      ],
      ephemeral: true
    });
  }

  return interaction.reply({
    embeds: [
      errorEmbed(
        "No pude encontrar ese comando."
      )
    ],
    ephemeral: true
  });
}

// ======================================================
// BOTÓN DE SORTEO
// ======================================================

client.on(
  "interactionCreate",
  async interaction => {
    if (
      !interaction.isButton()
    ) {
      return;
    }

    if (
      !interaction.customId.startsWith(
        "giveaway_join_"
      )
    ) {
      return;
    }

    const id =
      interaction.customId.replace(
        "giveaway_join_",
        ""
      );

    const giveaway =
      data.giveaways[id];

    if (
      !giveaway ||
      giveaway.ended ||
      Date.now() >= giveaway.endsAt
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Este sorteo ya terminó."
          )
        ],
        ephemeral: true
      });
    }

    giveaway.participants ??= [];

    if (
      giveaway.participants.includes(
        interaction.user.id
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Ya estás participando."
          )
        ],
        ephemeral: true
      });
    }

    giveaway.participants.push(
      interaction.user.id
    );

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          "Ya estás participando en el sorteo. 🎉"
        )
      ],
      ephemeral: true
    });
  }
);

// ======================================================
// LOGS DE MENSAJES
// ======================================================

client.on(
  "messageDelete",
  async message => {
    if (
      !message.guild ||
      message.author?.bot
    ) {
      return;
    }

    await logAction(
      message.guild,
      "messages",
      "🗑️ Mensaje eliminado",
      `👤 Usuario: ${message.author || "Desconocido"}\n` +
      `📍 Canal: ${message.channel}\n\n` +
      `💬 Contenido:\n${
        message.content
          ? `> ${message.content.slice(0, 1000)}`
          : "Sin contenido disponible."
      }`
    );
  }
);

client.on(
  "messageUpdate",
  async (oldMessage, newMessage) => {
    if (
      !newMessage.guild ||
      oldMessage.author?.bot ||
      oldMessage.content ===
        newMessage.content
    ) {
      return;
    }

    await logAction(
      newMessage.guild,
      "messages",
      "✏️ Mensaje editado",
      `👤 Usuario: ${newMessage.author}\n` +
      `📍 Canal: ${newMessage.channel}\n\n` +
      `Antes:\n> ${oldMessage.content?.slice(0, 500) || "Sin contenido"}\n\n` +
      `Después:\n> ${newMessage.content?.slice(0, 500) || "Sin contenido"}`
    );
  }
);

// ======================================================
// LOGS DE ROLES
// ======================================================

client.on(
  "guildMemberUpdate",
  async (oldMember, newMember) => {
    if (
      oldMember.roles.cache.size !==
      newMember.roles.cache.size
    ) {
      const added =
        newMember.roles.cache.filter(
          role =>
            !oldMember.roles.cache.has(
              role.id
            )
        );

      const removed =
        oldMember.roles.cache.filter(
          role =>
            !newMember.roles.cache.has(
              role.id
            )
        );

      if (added.size) {
        await logAction(
          newMember.guild,
          "roles",
          "➕ Rol añadido",
          `${newMember} recibió: ${added.map(
            role => role.toString()
          ).join(", ")}`
        );
      }

      if (removed.size) {
        await logAction(
          newMember.guild,
          "roles",
          "➖ Rol eliminado",
          `A ${newMember} se le quitó: ${removed.map(
            role => role.toString()
          ).join(", ")}`
        );
      }
    }
  }
);

// ======================================================
// LOGS DE CANALES
// ======================================================

client.on(
  "channelCreate",
  async channel => {
    if (
      !channel.guild
    ) return;

    await logAction(
      channel.guild,
      "channels",
      "📁 Canal creado",
      `Se creó ${channel}.`
    );
  }
);

client.on(
  "channelDelete",
  async channel => {
    if (
      !channel.guild
    ) return;

    await logAction(
      channel.guild,
      "channels",
      "🗑️ Canal eliminado",
      `Se eliminó el canal **${channel.name}**.`
    );
  }
);

// ======================================================
// LOGS DE ROLES CREADOS / ELIMINADOS
// ======================================================

client.on(
  "roleCreate",
  async role => {
    await logAction(
      role.guild,
      "roles",
      "🎭 Rol creado",
      `Se creó el rol ${role}.`
    );
  }
);

client.on(
  "roleDelete",
  async role => {
    await logAction(
      role.guild,
      "roles",
      "🗑️ Rol eliminado",
      `Se eliminó el rol **${role.name}**.`
    );
  }
);

// ======================================================
// LOGS DE BANS
// ======================================================

client.on(
  "guildBanAdd",
  async ban => {
    await logAction(
      ban.guild,
      "moderation",
      "🔨 Ban detectado",
      `${ban.user} fue baneado.\n\n` +
      `📝 Razón: ${
        ban.reason || "No disponible"
      }`,
      COLORS.error
    );
  }
);

client.on(
  "guildBanRemove",
  async ban => {
    await logAction(
      ban.guild,
      "moderation",
      "🔓 Ban retirado",
      `${ban.user} fue desbaneado.`,
      COLORS.success
    );
  }
);

// ======================================================
// LOGS DE VOZ
// ======================================================

client.on(
  "voiceStateUpdate",
  async (oldState, newState) => {
    if (
      !oldState.channelId &&
      newState.channelId
    ) {
      await logAction(
        newState.guild,
        "voice",
        "🔊 Entrada a voz",
        `${newState.member} entró a ${newState.channel}.`
      );
    }

    if (
      oldState.channelId &&
      !newState.channelId
    ) {
      await logAction(
        oldState.guild,
        "voice",
        "🔇 Salida de voz",
        `${oldState.member} salió de **${oldState.channel?.name || "voz"}**.`
      );
    }
  }
);

// ======================================================
// HONEYPOT
// ======================================================

client.on(
  "messageCreate",
  async message => {
    if (
      !message.guild ||
      message.author.bot
    ) {
      return;
    }

    const settings =
      getGuildSettings(
        message.guild.id
      );

    if (
      !settings.honeypotChannel ||
      message.channel.id !==
        settings.honeypotChannel
    ) {
      return;
    }

    if (
      isAdmin(
        message.member
      )
    ) {
      return;
    }

    try {
      if (
        message.member?.bannable
      ) {
        await message.member.ban({
          reason:
            "Honeypot"
        });

        await logAction(
          message.guild,
          "security",
          "🍯 Honeypot activado",
          `${message.author} activó el Honeypot y fue baneado.`,
          COLORS.security
        );
      }
    } catch (error) {
      console.error(
        "Error Honeypot:",
        error.message
      );
    }
  }
);

// ======================================================
// GUILD CREATE
// ======================================================

client.on(
  "guildCreate",
  async guild => {
    getGuildSettings(
      guild.id
    );

    saveData();

    await cacheInvites(
      guild
    );

    console.log(
      `➕ Unido a ${guild.name}`
    );
  }
);

// ======================================================
// READY
// ======================================================

client.once(
  "clientReady",
  async () => {
    console.log(
      `✅ ${client.user.tag} conectado.`
    );

    console.log(
      `🌐 Servidores: ${client.guilds.cache.size}`
    );

    try {
      const rest =
        new REST({
          version: "10"
        }).setToken(
          TOKEN
        );

      await rest.put(
        Routes.applicationCommands(
          CLIENT_ID
        ),
        {
          body:
            commands
        }
      );

      console.log(
        `✅ ${commands.length} comandos registrados.`
      );

    } catch (error) {
      console.error(
        "Error registrando comandos:",
        error
      );
    }

    for (
      const guild
      of client.guilds.cache.values()
    ) {
      await cacheInvites(
        guild
      );
    }

    client.user.setPresence({
      activities: [
        {
          name:
            "LRM Studio 💜",
          type: 3
        }
      ],
      status:
        "online"
    });
  }
);

// ======================================================
// ERRORES
// ======================================================

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ Unhandled Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);

// ======================================================
// LOGIN
// ======================================================

if (!TOKEN) {
  console.error(
    "❌ Falta DISCORD_TOKEN."
  );

  process.exit(1);
}

if (!CLIENT_ID) {
  console.error(
    "❌ Falta CLIENT_ID."
  );

  process.exit(1);
}

client.login(
  TOKEN
);

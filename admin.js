const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags
} = require("discord.js");

/* =========================================================
   LRM STUDIO — ADMIN SYSTEM
   ========================================================= */

const STAFF_ROLE_ID = "1565609209444175893";

const COLORS = {
  primary: "#7C8CFF",
  success: "#57F287",
  error: "#ED4245",
  warning: "#FEE75C",
  level: "#C084FC",
  info: "#60A5FA",
  admin: "#A78BFA",
  royale: "#F5B7FF"
};

const E = {
  warning: "⚠️",
  error: "❌",
  success: "✅",
  info: "ℹ️",
  admin: "⚙️"
};

const DEFAULT_HONEYPOT_MESSAGE = `🍯・Honeypot

Este canal forma parte del sistema de seguridad de LRM Studio.

⚠️ No interactúes con este canal.

Cualquier interacción será detectada automáticamente y podrá activar las medidas de seguridad del servidor.

🛡️ LRM Studio Security`;

/* =========================================================
   HELPERS
   ========================================================= */

function glassEmbed(title, description, color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: "LRM Studio • Fluent Glass"
    });
}

function errorEmbed(message) {
  return glassEmbed(
    `${E.error} Error`,
    message,
    COLORS.error
  );
}

function successEmbed(message) {
  return glassEmbed(
    `${E.success} Listo`,
    message,
    COLORS.success
  );
}

function getArgs(content) {
  const matches =
    content.match(/"[^"]+"|'[^']+'|\S+/g) || [];

  return matches.map(x => {
    if (
      (x.startsWith('"') && x.endsWith('"')) ||
      (x.startsWith("'") && x.endsWith("'"))
    ) {
      return x.slice(1, -1);
    }

    return x;
  });
}

function getMentionedMember(message, value) {
  if (!value) return null;

  const match = value.match(/^<@!?(\d+)>$/);

  if (!match) return null;

  return (
    message.guild.members.cache.get(match[1]) ||
    null
  );
}

function parseChannel(message, value) {
  if (!value) return null;

  const mention = value.match(/^<#(\d+)>$/);

  if (mention) {
    return (
      message.guild.channels.cache.get(mention[1]) ||
      null
    );
  }

  return (
    message.guild.channels.cache.get(value) ||
    null
  );
}

function parseRole(message, value) {
  if (!value) return null;

  const mention = value.match(/^<@&(\d+)>$/);

  if (mention) {
    return (
      message.guild.roles.cache.get(mention[1]) ||
      null
    );
  }

  return (
    message.guild.roles.cache.get(value) ||
    null
  );
}

function panelKey(name) {
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function parseMenuEmoji(emoji) {
  if (!emoji) return "🎫";

  const custom =
    emoji.match(/^<a?:\w+:(\d+)>$/);

  if (custom) return emoji;

  return emoji;
}

/* =========================================================
   DATA
   ========================================================= */

function ensureData(data) {
  data.ticketSystem ??= {};
  data.ticketSystem.panels ??= {};
  data.ticketSystem.staffRoles ??= {};
  data.ticketSystem.openTickets ??= {};
  data.ticketSystem.logs ??= {};

  data.guildSettings ??= {};

  data.honeypot ??= {};
  data.honeypot.message ??=
    DEFAULT_HONEYPOT_MESSAGE;
  data.honeypot.guilds ??= {};

  data.moderation ??= {};
  data.moderation.warnings ??= {};
}

function getGuildSettings(data, guildId) {
  data.guildSettings ??= {};

  data.guildSettings[guildId] ??= {
    welcomeChannel: null,
    inviteChannel: null,
    levelChannel: null,
    allianceChannel: null,
    affysChannel: null,
    suggestionChannel: null,
    honeypotChannel: null
  };

  return data.guildSettings[guildId];
}

/* =========================================================
   PERMISSIONS
   ========================================================= */

function discordAdmin(member) {
  if (!member) return false;

  return (
    member.permissions.has(
      PermissionFlagsBits.Administrator
    ) ||
    member.guild.ownerId === member.id
  );
}

function getRolePermissions(data, guildId, roleId) {
  const roles =
    data.ticketSystem?.staffRoles?.[guildId] || {};

  return roles[roleId] || {};
}

function hasStaffPermission(
  data,
  member,
  permission
) {
  if (!member) return false;

  if (discordAdmin(member)) return true;

  if (
    member.roles.cache.has(STAFF_ROLE_ID)
  ) {
    return true;
  }

  const roles =
    data.ticketSystem?.staffRoles?.[
      member.guild.id
    ] || {};

  for (const role of member.roles.cache.values()) {
    const permissions = roles[role.id];

    if (!permissions) continue;

    if (
      permissions.admin === true ||
      permissions[permission] === true
    ) {
      return true;
    }
  }

  return false;
}

function canManage(
  data,
  member,
  permission
) {
  return (
    discordAdmin(member) ||
    hasStaffPermission(
      data,
      member,
      permission
    )
  );
}

/* =========================================================
   MODERATION
   ========================================================= */

function ensureWarnings(
  data,
  guildId,
  userId
) {
  data.moderation ??= {};
  data.moderation.warnings ??= {};
  data.moderation.warnings[guildId] ??= {};
  data.moderation.warnings[guildId][userId] ??= [];

  return data.moderation.warnings[
    guildId
  ][userId];
}

function checkModerationTarget(
  guild,
  moderator,
  target
) {
  if (!target) {
    return "No encontré a ese usuario.";
  }

  if (target.id === guild.ownerId) {
    return "No puedes moderar al dueño del servidor.";
  }

  if (target.id === moderator.id) {
    return "No puedes moderarte a vos mismo.";
  }

  if (
    guild.ownerId !== moderator.id &&
    moderator.roles.highest.position <=
      target.roles.highest.position
  ) {
    return (
      "El rol del usuario está al mismo nivel o por encima del tuyo."
    );
  }

  const botMember = guild.members.me;

  if (
    botMember &&
    botMember.roles.highest.position <=
      target.roles.highest.position
  ) {
    return (
      "Mi rol está por debajo del rol de ese usuario."
    );
  }

  return null;
}

/* =========================================================
   HONEYPOT
   ========================================================= */

async function updateHoneypotMessage(
  guild,
  config
) {
  if (!config?.channelId || !config?.messageId) {
    return;
  }

  const channel =
    guild.channels.cache.get(
      config.channelId
    );

  if (!channel) return;

  const msg =
    await channel.messages
      .fetch(config.messageId)
      .catch(() => null);

  if (!msg) return;

  const row =
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(
          "honeypot_counter"
        )
        .setLabel(
          `Ban: ${Number(config.bans || 0)}`
        )
        .setStyle(
          ButtonStyle.Danger
        )
        .setDisabled(true)
    );

  await msg.edit({
    content:
      DEFAULT_HONEYPOT_MESSAGE,
    components: [row]
  }).catch(() => {});
}

async function setupHoneypot(
  guild,
  channel,
  data,
  saveData
) {
  data.honeypot ??= {};
  data.honeypot.guilds ??= {};

  const old =
    data.honeypot.guilds[guild.id];

  if (old?.messageId) {
    const oldChannel =
      guild.channels.cache.get(
        old.channelId
      );

    if (oldChannel) {
      const oldMessage =
        await oldChannel.messages
          .fetch(old.messageId)
          .catch(() => null);

      if (oldMessage) {
        await oldMessage
          .delete()
          .catch(() => {});
      }
    }
  }

  const row =
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(
          "honeypot_counter"
        )
        .setLabel("Ban: 0")
        .setStyle(
          ButtonStyle.Danger
        )
        .setDisabled(true)
    );

  const sent =
    await channel.send({
      content:
        DEFAULT_HONEYPOT_MESSAGE,
      components: [row]
    });

  data.honeypot.guilds[guild.id] = {
    channelId: channel.id,
    messageId: sent.id,
    bans: 0
  };

  saveData();

  return sent;
}

/* =========================================================
   HELP
   ========================================================= */

const HELP_CATEGORIES = {
  help: {
    name: "📚 Help",
    description:
      "Ayuda y comandos generales",
    commands: [
      [".help", "Abrir este menú"],
      [".admin", "Panel administrativo"],
      [".ping", "Ver latencia"],
      [".uptime", "Ver tiempo activo"],
      [".membercount", "Ver miembros"],
      [".servericon", "Ver icono"],
      [".serverinfo", "Información del servidor"],
      [".userinfo", "Información de usuario"],
      [".roleinfo", "Información de rol"],
      [".channelinfo", "Información de canal"]
    ]
  },

  diversion: {
    name: "🎮 Diversión",
    description:
      "Comandos para divertirte",
    commands: [
      [".dice", "Lanzar un dado"],
      [".choose", "Elegir entre opciones"],
      [".rps", "Piedra, papel o tijera"],
      [".reverse", "Invertir un texto"],
      [".8ball", "Preguntar a la bola 8"],
      [".coinflip", "Lanzar una moneda"],
      [".random", "Número aleatorio"],
      [".avatar", "Ver avatar"]
    ]
  },

  rank: {
    name: "🏆 Rank",
    description:
      "Niveles y clasificación",
    commands: [
      [".rank", "Ver tu rango"],
      [".rank @usuario", "Ver rango de usuario"],
      [".level", "Ver nivel"],
      [".xp", "Ver XP"],
      [".top rank", "Top de niveles"],
      [".top level", "Top de XP"],
      [".invitever", "Ver invitaciones"],
      [".top invite", "Top de invitaciones"],
      [".top alliance", "Top de alianzas"],
      [".top affy", "Top de affys"]
    ]
  },

  top: {
    name: "📊 Top",
    description:
      "Clasificaciones del servidor",
    commands: [
      [".top", "Abrir menú de Tops"],
      [".top rank", "Top de niveles"],
      [".top level", "Top de XP"],
      [".top invite", "Top de invitaciones"],
      [".top alliance", "Top de alianzas"],
      [".top affy", "Top de affys"],
      [".top messages", "Top de mensajes"],
      [".top voice", "Top de voz"],
      [".top wins", "Top de victorias"],
      [".top all", "Resumen de Tops"]
    ]
  },

  info: {
    name: "ℹ️ Info",
    description:
      "Información del servidor",
    commands: [
      [".ping", "Latencia"],
      [".uptime", "Tiempo activo"],
      [".membercount", "Miembros"],
      [".servericon", "Icono"],
      [".serverinfo", "Información del servidor"],
      [".userinfo", "Información de usuario"],
      [".roleinfo", "Información de rol"],
      [".channelinfo", "Información de canal"],
      [".botinfo", "Información del bot"],
      [".invitever", "Tus invitaciones"]
    ]
  },

  moderation: {
    name: "🛡️ Moderación",
    description:
      "Herramientas de moderación",
    commands: [
      [".ban", "Banear"],
      [".kick", "Expulsar"],
      [".mute", "Silenciar"],
      [".unmute", "Quitar silencio"],
      [".unban", "Desbanear"],
      [".purge", "Eliminar mensajes"],
      [".warn", "Advertir"],
      [".warnings", "Ver advertencias"],
      [".clearwarns", "Limpiar advertencias"],
      [".admin", "Panel administrativo"]
    ]
  },

  tickets: {
    name: "🎫 Tickets",
    description:
      "Sistema de tickets",
    commands: [
      [".panel", "Crear panel"],
      [".ticketpanel", "Publicar panel"],
      [".staff", "Configurar staff"],
      [".valoraciones", "Configurar valoraciones"],
      [".ticketlogs", "Configurar logs"],
      [".transaccion", "Configurar transacciones"],
      ["Reclamar", "Reclamar ticket"],
      ["Cerrar", "Cerrar ticket"],
      ["Valorar", "Valorar ticket"],
      ["Gestionar", "Gestionar ticket"]
    ]
  },

  configuration: {
    name: "⚙️ Configuración",
    description:
      "Configuración del servidor",
    commands: [
      [".bienvenidaset", "Bienvenidas"],
      [".inviteset", "Invitaciones"],
      [".niveleset", "Niveles"],
      [".alianzaset", "Alianzas"],
      [".affysset", "Affys"],
      [".honeypotset", "Honeypot"],
      [".surgeset", "Sugerencias"],
      [".staff", "Staff"],
      [".ticketlogs", "Logs"],
      [".valoraciones", "Valoraciones"]
    ]
  }
};

function helpEmbed(
  category = "help"
) {
  const info =
    HELP_CATEGORIES[category] ||
    HELP_CATEGORIES.help;

  const embed =
    new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle(
        `${info.name} • LRM Studio`
      )
      .setDescription(
        info.description
      )
      .setFooter({
        text:
          "LRM Studio • Fluent Glass"
      });

  for (
    const [command, description]
    of info.commands
  ) {
    embed.addFields({
      name: `\`${command}\``,
      value: description,
      inline: true
    });
  }

  return embed;
}

function helpMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(
          "lrm_help_menu"
        )
        .setPlaceholder(
          "Selecciona una categoría"
        )
        .addOptions(
          {
            label: "Help",
            description:
              "Ayuda general",
            value: "help",
            emoji: "📚"
          },
          {
            label: "Diversión",
            description:
              "Comandos divertidos",
            value: "diversion",
            emoji: "🎮"
          },
          {
            label: "Rank",
            description:
              "Niveles y clasificación",
            value: "rank",
            emoji: "🏆"
          },
          {
            label: "Top",
            description:
              "Clasificaciones",
            value: "top",
            emoji: "📊"
          },
          {
            label: "Info",
            description:
              "Información",
            value: "info",
            emoji: "ℹ️"
          },
          {
            label: "Moderación",
            description:
              "Moderación",
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
            label: "Configuración",
            description:
              "Configuración",
            value: "configuration",
            emoji: "⚙️"
          }
        )
    );
}

/* =========================================================
   ADMIN MENU
   ========================================================= */

function adminEmbed(
  category = "main"
) {
  if (category === "moderation") {
    return glassEmbed(
      "🛡️ Moderación • LRM Studio",
      "Ban, kick, mute, unmute, unban, purge y warnings.",
      COLORS.error
    );
  }

  if (category === "tickets") {
    return glassEmbed(
      "🎫 Tickets • LRM Studio",
      "Gestiona paneles, staff y logs de tickets.",
      COLORS.primary
    );
  }

  if (category === "configuration") {
    return glassEmbed(
      "⚙️ Configuración • LRM Studio",
      "Configura los sistemas principales del servidor.",
      COLORS.admin
    );
  }

  if (category === "security") {
    return glassEmbed(
      "🍯 Seguridad • LRM Studio",
      "Herramientas de seguridad y protección.",
      COLORS.warning
    );
  }

  return glassEmbed(
    "⚙️ Administración • LRM Studio",
    "Bienvenido al panel administrativo.\n\nSelecciona una categoría.",
    COLORS.admin
  );
}

function adminMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(
          "lrm_admin_menu"
        )
        .setPlaceholder(
          "Selecciona una categoría"
        )
        .addOptions(
          {
            label: "Moderación",
            description:
              "Ban, kick, mute, warns y purge",
            value: "moderation",
            emoji: "🛡️"
          },
          {
            label: "Tickets",
            description:
              "Paneles, staff y logs",
            value: "tickets",
            emoji: "🎫"
          },
          {
            label: "Configuración",
            description:
              "Configurar sistemas",
            value: "configuration",
            emoji: "⚙️"
          },
          {
            label: "Seguridad",
            description:
              "Honeypot y seguridad",
            value: "security",
            emoji: "🍯"
          }
        )
    );
}

/* =========================================================
   SLASH COMMANDS
   IMPORTANTE:
   NO HACER .map(x => x.toJSON()) AQUÍ
   ========================================================= */

const adminCommands = [
  new SlashCommandBuilder()
    .setName("admin")
    .setDescription(
      "Abre el panel administrativo"
    ),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription(
      "Crea un panel de tickets"
    )
    .addStringOption(o =>
      o.setName("nombre")
        .setDescription(
          "Nombre del panel"
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensaje_panel")
        .setDescription(
          "Mensaje del panel"
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("preguntas")
        .setDescription(
          "Preguntas separadas por |"
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("emoji")
        .setDescription(
          "Emoji del botón"
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensaje_ingreso")
        .setDescription(
          "Mensaje al crear ticket"
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("pregunta1")
        .setDescription(
          "Pregunta adicional"
        )
    )
    .addStringOption(o =>
      o.setName("pregunta2")
        .setDescription(
          "Segunda pregunta adicional"
        )
    ),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription(
      "Publica un panel de tickets"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription(
          "Canal donde se publicará"
        )
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("panel")
        .setDescription(
          "Clave del panel"
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("staff")
    .setDescription(
      "Configura permisos de staff"
    )
    .addRoleOption(o =>
      o.setName("rol")
        .setDescription("Rol")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("permiso")
        .setDescription(
          "Permiso"
        )
        .setRequired(true)
        .addChoices(
          { name: "Ver tickets", value: "ver_ticket" },
          { name: "Cerrar tickets", value: "cerrar_ticket" },
          { name: "Reclamar tickets", value: "reclamar_ticket" },
          { name: "Gestionar tickets", value: "gestionar_tickets" },
          { name: "Ban", value: "ban" },
          { name: "Kick", value: "kick" },
          { name: "Mute", value: "mute" },
          { name: "Unmute", value: "unmute" },
          { name: "Unban", value: "unban" },
          { name: "Purge", value: "purge" },
          { name: "Warn", value: "warn" },
          { name: "Warnings", value: "warnings" },
          { name: "Clear warnings", value: "clearwarns" },
          { name: "Admin", value: "admin" }
        )
    )
    .addStringOption(o =>
      o.setName("accion")
        .setDescription("Acción")
        .addChoices(
          { name: "Agregar", value: "add" },
          { name: "Quitar", value: "remove" }
        )
    ),

  new SlashCommandBuilder()
    .setName("valoraciones")
    .setDescription(
      "Configura valoraciones"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("transaccion")
    .setDescription(
      "Configura transacciones"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticketlogs")
    .setDescription(
      "Configura logs de tickets"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription(
      "Banea a un usuario"
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon")
        .setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription(
      "Expulsa a un usuario"
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon")
        .setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription(
      "Silencia a un usuario"
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutos")
        .setDescription("Duración")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon")
        .setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription(
      "Quita el timeout"
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon")
        .setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription(
      "Desbanea mediante ID"
    )
    .addStringOption(o =>
      o.setName("usuario_id")
        .setDescription(
          "ID del usuario"
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon")
        .setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription(
      "Elimina mensajes"
    )
    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription("1-100")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription(
      "Advierte a un usuario"
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon")
        .setDescription("Razón")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription(
      "Muestra advertencias"
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
    ),

  new SlashCommandBuilder()
    .setName("clearwarns")
    .setDescription(
      "Elimina advertencias"
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("bienvenidaset")
    .setDescription(
      "Configura bienvenidas"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("inviteset")
    .setDescription(
      "Configura invitaciones"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("niveleset")
    .setDescription(
      "Configura niveles"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("alianzaset")
    .setDescription(
      "Configura alianzas"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("affysset")
    .setDescription(
      "Configura affys"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("honeypotset")
    .setDescription(
      "Configura Honeypot"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("surgeset")
    .setDescription(
      "Configura sugerencias"
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    )
];

/* =========================================================
   TICKET SYSTEM
   ========================================================= */

function getTicketViewerRoles(
  data,
  guildId
) {
  const result = [];

  const roles =
    data.ticketSystem?.staffRoles?.[
      guildId
    ] || {};

  for (
    const [roleId, permissions]
    of Object.entries(roles)
  ) {
    if (
      permissions.ver_ticket ||
      permissions.gestionar_tickets ||
      permissions.admin
    ) {
      result.push(roleId);
    }
  }

  return result;
}

async function createTicket({
  interaction,
  panel,
  data,
  saveData
}) {
  const guild = interaction.guild;
  const user = interaction.user;

  data.ticketSystem.openTickets[guild.id] ??= {};

  for (
    const ticket of Object.values(
      data.ticketSystem.openTickets[
        guild.id
      ]
    )
  ) {
    if (
      ticket.userId === user.id &&
      ticket.panel === panel.key
    ) {
      const existing =
        guild.channels.cache.get(
          ticket.channelId
        );

      if (existing) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `Ya tienes un ticket abierto: ${existing}`
            )
          ],
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    },
    {
      id: STAFF_ROLE_ID,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    }
  ];

  for (
    const roleId of getTicketViewerRoles(
      data,
      guild.id
    )
  ) {
    if (roleId === STAFF_ROLE_ID) continue;

    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    });
  }

  const channel =
    await guild.channels.create({
      name:
        `ticket-${user.username}`
          .toLowerCase()
          .replace(
            /[^a-z0-9-]/g,
            "-"
          )
          .slice(0, 90),
      type: ChannelType.GuildText,
      permissionOverwrites:
        overwrites
    });

  data.ticketSystem.openTickets[
    guild.id
  ][channel.id] = {
    userId: user.id,
    panel: panel.key,
    channelId: channel.id,
    claimedBy: null,
    createdAt: Date.now()
  };

  saveData();

  const buttons =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            "ticket_claim"
          )
          .setLabel("Reclamar")
          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()
          .setCustomId(
            "ticket_close"
          )
          .setLabel("Cerrar")
          .setStyle(
            ButtonStyle.Danger
          )
      );

  const embed =
    new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle(
        `🎫 ${panel.name}`
      )
      .setDescription(
        panel.welcomeMessage ||
          "Gracias por abrir un ticket. Un miembro del equipo te atenderá pronto."
      )
      .setFooter({
        text:
          "LRM Studio • Fluent Glass"
      });

  await channel.send({
    content:
      `${user} <@&${STAFF_ROLE_ID}>`,
    embeds: [embed],
    components: [buttons]
  });

  return interaction.reply({
    embeds: [
      successEmbed(
        `Tu ticket fue creado correctamente: ${channel}`
      )
    ],
    flags: MessageFlags.Ephemeral
  });
}

async function requestTicketClose(
  interaction,
  data
) {
  const ticket =
    data.ticketSystem
      ?.openTickets
      ?.[interaction.guild.id]
      ?.[interaction.channel.id];

  if (!ticket) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Este canal no es un ticket válido."
        )
      ],
      flags: MessageFlags.Ephemeral
    });
  }

  if (
    !canManage(
      data,
      interaction.member,
      "cerrar_ticket"
    ) &&
    ticket.userId !==
      interaction.user.id
  ) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "No tienes permiso para cerrar este ticket."
        )
      ],
      flags: MessageFlags.Ephemeral
    });
  }

  const row =
    new ActionRowBuilder();

  for (let i = 1; i <= 5; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          `ticket_rate_${i}`
        )
        .setLabel(String(i))
        .setStyle(
          i >= 4
            ? ButtonStyle.Success
            : i === 3
              ? ButtonStyle.Secondary
              : ButtonStyle.Danger
        )
    );
  }

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle(
          "⭐ Valora tu ticket"
        )
        .setDescription(
          "Antes de cerrar definitivamente el ticket, selecciona una valoración del 1 al 5."
        )
        .setFooter({
          text:
            "LRM Studio • Fluent Glass"
        })
    ],
    components: [row]
  });
}

/* =========================================================
   PREFIX COMMANDS
   ========================================================= */

const PREFIX_COMMANDS =
  new Set([
    "admin",
    "help",

    "panel",
    "ticketpanel",
    "staff",
    "valoraciones",
    "transaccion",
    "ticketlogs",

    "ban",
    "kick",
    "mute",
    "unmute",
    "unban",
    "purge",
    "warn",
    "warnings",
    "clearwarns",

    "bienvenidaset",
    "inviteset",
    "niveleset",
    "alianzaset",
    "affysset",
    "honeypotset",
    "surgeset"
  ]);

/* =========================================================
   SETUP
   ========================================================= */

function setupAdmin({
  client,
  data,
  saveData,
  prefix = "."
}) {
  ensureData(data);

  /* =====================================================
     MESSAGE CREATE
     ===================================================== */

  client.on(
    "messageCreate",
    async message => {
      try {
        if (!message.guild) return;
        if (message.author.bot) return;

        /* ================= HONEYPOT ================= */

        const hp =
          data.honeypot
            ?.guilds
            ?.[message.guild.id];

        if (
          hp &&
          hp.channelId ===
            message.channel.id
        ) {
          if (
            message.author.id ===
              message.guild.ownerId ||
            message.member.permissions.has(
              PermissionFlagsBits.Administrator
            ) ||
            message.member.roles.cache.has(
              STAFF_ROLE_ID
            )
          ) {
            return;
          }

          const botMember =
            message.guild.members.me;

          if (
            !botMember ||
            !botMember.permissions.has(
              PermissionFlagsBits.BanMembers
            )
          ) {
            return;
          }

          if (
            message.member.roles.highest
              .position >=
            botMember.roles.highest
              .position
          ) {
            return;
          }

          const banned =
            await message.guild.members
              .ban(
                message.author.id,
                {
                  reason:
                    "LRM Studio Honeypot"
                }
              )
              .then(() => true)
              .catch(() => false);

          if (!banned) return;

          hp.bans =
            Number(hp.bans || 0) + 1;

          await message.delete()
            .catch(() => {});

          saveData();

          await updateHoneypotMessage(
            message.guild,
            hp
          );

          return;
        }

        if (
          !message.content.startsWith(
            prefix
          )
        ) {
          return;
        }

        const args = getArgs(
          message.content
            .slice(prefix.length)
            .trim()
        );

        if (!args.length) return;

        const command =
          args.shift().toLowerCase();

        if (
          !PREFIX_COMMANDS.has(
            command
          )
        ) {
          return;
        }

        /* ================= HELP ================= */

        if (command === "help") {
          return message.reply({
            embeds: [
              helpEmbed()
            ],
            components: [
              helpMenu()
            ]
          });
        }

        /* ================= ADMIN ================= */

        if (command === "admin") {
          if (
            !discordAdmin(
              message.member
            )
          ) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "Necesitas permisos de **Administrador**."
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

        const permissionCommands = [
          "panel",
          "ticketpanel",
          "staff",
          "valoraciones",
          "transaccion",
          "ticketlogs",
          "ban",
          "kick",
          "mute",
          "unmute",
          "unban",
          "purge",
          "warn",
          "warnings",
          "clearwarns",
          "bienvenidaset",
          "inviteset",
          "niveleset",
          "alianzaset",
          "affysset",
          "honeypotset",
          "surgeset"
        ];

        if (
          permissionCommands.includes(
            command
          )
        ) {
          const permission =
            command ===
            "ticketpanel"
              ? "gestionar_tickets"
              : command;

          if (
            !canManage(
              data,
              message.member,
              permission
            )
          ) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No tienes permisos para usar este comando."
                )
              ]
            });
          }
        }

        /* ================= PANEL ================= */

        if (command === "panel") {
          const name =
            args.shift();

          const panelMessage =
            args.shift();

          const questionsText =
            args.shift();

          const emoji =
            args.shift() || "🎫";

          const welcomeMessage =
            args.shift() ||
            "Gracias por abrir un ticket. Un miembro del equipo te atenderá pronto.";

          if (
            !name ||
            !panelMessage ||
            !questionsText
          ) {
            return message.reply({
              embeds: [
                errorEmbed(
                  `Uso: \`${prefix}panel nombre "mensaje" "pregunta1|pregunta2" 🎫 "mensaje ingreso"\``
                )
              ]
            });
          }

          const questions =
            questionsText
              .split("|")
              .map(x =>
                x.trim()
              )
              .filter(Boolean);

          data.ticketSystem.panels[
            panelKey(name)
          ] = {
            key:
              panelKey(name),
            name,
            message:
              panelMessage,
            questions,
            emoji:
              parseMenuEmoji(
                emoji
              ),
            welcomeMessage
          };

          saveData();

          return message.reply({
            embeds: [
              successEmbed(
                `Panel **${name}** creado correctamente.`
              )
            ]
          });
        }

        /* ================= TICKET PANEL ================= */

        if (
          command ===
          "ticketpanel"
        ) {
          const channel =
            parseChannel(
              message,
              args[0]
            );

          const key = args[1];

          const panel =
            data.ticketSystem
              .panels[key];

          if (
            !channel ||
            !panel
          ) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "Canal o panel no válido."
                )
              ]
            });
          }

          const button =
            new ButtonBuilder()
              .setCustomId(
                `ticket_open_${panel.key}`
              )
              .setLabel(
                "Abrir ticket"
              )
              .setEmoji(
                panel.emoji ||
                  "🎫"
              )
              .setStyle(
                ButtonStyle.Primary
              );

          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(
                  COLORS.primary
                )
                .setTitle(
                  `🎫 ${panel.name}`
                )
                .setDescription(
                  panel.message
                )
                .setFooter({
                  text:
                    "LRM Studio • Fluent Glass"
                })
            ],
            components: [
              new ActionRowBuilder()
                .addComponents(
                  button
                )
            ]
          });

          return message.reply({
            embeds: [
              successEmbed(
                `Panel publicado en ${channel}.`
              )
            ]
          });
        }

        /* ================= STAFF ================= */

        if (command === "staff") {
          const role =
            parseRole(
              message,
              args[0]
            );

          const permission =
            args[1];

          const action =
            args[2] || "add";

          if (
            !role ||
            !permission
          ) {
            return message.reply({
              embeds: [
                errorEmbed(
                  `Uso: \`${prefix}staff @rol permiso add/remove\``
                )
              ]
            });
          }

          data.ticketSystem
            .staffRoles[
              message.guild.id
            ] ??= {};

          data.ticketSystem
            .staffRoles[
              message.guild.id
            ][role.id] ??= {};

          if (
            action ===
            "remove"
          ) {
            delete data
              .ticketSystem
              .staffRoles[
                message.guild.id
              ][role.id][
                permission
              ];
          } else {
            data
              .ticketSystem
              .staffRoles[
                message.guild.id
              ][role.id][
                permission
              ] = true;
          }

          saveData();

          return message.reply({
            embeds: [
              successEmbed(
                `${role} → \`${permission}\` → **${action}**`
              )
            ]
          });
        }

        /* ================= BAN ================= */

        if (command === "ban") {
          const member =
            getMentionedMember(
              message,
              args[0]
            ) ||
            await message.guild.members
              .fetch(args[0])
              .catch(() => null);

          if (!member) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No encontré a ese usuario."
                )
              ]
            });
          }

          const problem =
            checkModerationTarget(
              message.guild,
              message.author.id,
              member
            );

          if (problem) {
            return message.reply({
              embeds: [
                errorEmbed(
                  problem
                )
              ]
            });
          }

          if (!member.bannable) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No puedo banear a ese usuario."
                )
              ]
            });
          }

          const reason =
            args
              .slice(1)
              .join(" ") ||
            "Sin razón especificada";

          await member.ban({
            reason
          });

          return message.reply({
            embeds: [
              successEmbed(
                `${member.user.tag} fue baneado.\n**Razón:** ${reason}`
              )
            ]
          });
        }

        /* ================= KICK ================= */

        if (command === "kick") {
          const member =
            getMentionedMember(
              message,
              args[0]
            ) ||
            await message.guild.members
              .fetch(args[0])
              .catch(() => null);

          if (!member) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No encontré a ese usuario."
                )
              ]
            });
          }

          const problem =
            checkModerationTarget(
              message.guild,
              message.author.id,
              member
            );

          if (problem) {
            return message.reply({
              embeds: [
                errorEmbed(
                  problem
                )
              ]
            });
          }

          if (!member.kickable) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No puedo expulsar a ese usuario."
                )
              ]
            });
          }

          const reason =
            args
              .slice(1)
              .join(" ") ||
            "Sin razón especificada";

          await member.kick(
            reason
          );

          return message.reply({
            embeds: [
              successEmbed(
                `${member.user.tag} fue expulsado.\n**Razón:** ${reason}`
              )
            ]
          });
        }

        /* ================= MUTE ================= */

        if (command === "mute") {
          const member =
            getMentionedMember(
              message,
              args[0]
            ) ||
            await message.guild.members
              .fetch(args[0])
              .catch(() => null);

          const minutes =
            Number(args[1]);

          if (
            !member ||
            !Number.isInteger(
              minutes
            ) ||
            minutes < 1 ||
            minutes > 40320
          ) {
            return message.reply({
              embeds: [
                errorEmbed(
                  `Uso: \`${prefix}mute @usuario minutos razón\``
                )
              ]
            });
          }

          const problem =
            checkModerationTarget(
              message.guild,
              message.author.id,
              member
            );

          if (problem) {
            return message.reply({
              embeds: [
                errorEmbed(
                  problem
                )
              ]
            });
          }

          if (!member.moderatable) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No puedo aplicar timeout a ese usuario."
                )
              ]
            });
          }

          const reason =
            args
              .slice(2)
              .join(" ") ||
            "Sin razón especificada";

          await member.timeout(
            minutes * 60000,
            reason
          );

          return message.reply({
            embeds: [
              successEmbed(
                `${member.user.tag} fue silenciado durante **${minutes} minutos**.`
              )
            ]
          });
        }

        /* ================= UNMUTE ================= */

        if (command === "unmute") {
          const member =
            getMentionedMember(
              message,
              args[0]
            ) ||
            await message.guild.members
              .fetch(args[0])
              .catch(() => null);

          if (!member) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No encontré a ese usuario."
                )
              ]
            });
          }

          const problem =
            checkModerationTarget(
              message.guild,
              message.author.id,
              member
            );

          if (problem) {
            return message.reply({
              embeds: [
                errorEmbed(
                  problem
                )
              ]
            });
          }

          if (!member.moderatable) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No puedo quitar el timeout."
                )
              ]
            });
          }

          await member.timeout(
            null,
            args
              .slice(1)
              .join(" ") ||
              "Timeout eliminado"
          );

          return message.reply({
            embeds: [
              successEmbed(
                `Timeout eliminado para ${member.user.tag}.`
              )
            ]
          });
        }

        /* ================= UNBAN ================= */

        if (command === "unban") {
          const id =
            args[0];

          if (
            !/^\d{17,20}$/.test(
              id || ""
            )
          ) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "Debes proporcionar una ID válida."
                )
              ]
            });
          }

          await message.guild.members
            .unban(
              id,
              args
                .slice(1)
                .join(" ") ||
                "Desbaneado por staff"
            );

          return message.reply({
            embeds: [
              successEmbed(
                `Usuario \`${id}\` desbaneado.`
              )
            ]
          });
        }

        /* ================= PURGE ================= */

        if (command === "purge") {
          const amount =
            Number(args[0]);

          if (
            !Number.isInteger(
              amount
            ) ||
            amount < 1 ||
            amount > 100
          ) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "La cantidad debe estar entre 1 y 100."
                )
              ]
            });
          }

          const deleted =
            await message.channel
              .bulkDelete(
                amount,
                true
              );

          const response =
            await message.channel.send({
              embeds: [
                successEmbed(
                  `Se eliminaron **${deleted.size}** mensajes.`
                )
              ]
            });

          setTimeout(
            () =>
              response
                .delete()
                .catch(() => {}),
            3000
          );

          return;
        }

        /* ================= WARN ================= */

        if (command === "warn") {
          const member =
            getMentionedMember(
              message,
              args[0]
            ) ||
            await message.guild.members
              .fetch(args[0])
              .catch(() => null);

          if (!member) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No encontré a ese usuario."
                )
              ]
            });
          }

          const problem =
            checkModerationTarget(
              message.guild,
              message.author.id,
              member
            );

          if (problem) {
            return message.reply({
              embeds: [
                errorEmbed(
                  problem
                )
              ]
            });
          }

          const reason =
            args
              .slice(1)
              .join(" ") ||
            "Sin razón especificada";

          const warnings =
            ensureWarnings(
              data,
              message.guild.id,
              member.id
            );

          warnings.push({
            reason,
            moderatorId:
              message.author.id,
            timestamp:
              Date.now()
          });

          saveData();

          return message.reply({
            embeds: [
              successEmbed(
                `${member.user.tag} recibió una advertencia.\n\n**Razón:** ${reason}\n**Warnings:** ${warnings.length}`
              )
            ]
          });
        }

        /* ================= WARNINGS ================= */

        if (
          command === "warnings"
        ) {
          const member =
            getMentionedMember(
              message,
              args[0]
            ) ||
            message.member;

          const warnings =
            ensureWarnings(
              data,
              message.guild.id,
              member.id
            );

          if (!warnings.length) {
            return message.reply({
              embeds: [
                glassEmbed(
                  "🛡️ Warnings",
                  `${member.user.tag} no tiene advertencias.`,
                  COLORS.info
                )
              ]
            });
          }

          const text =
            warnings
              .slice(-10)
              .map(
                (w, i) =>
                  `**${i + 1}.** ${w.reason}\n> <@${w.moderatorId}> • <t:${Math.floor(w.timestamp / 1000)}:R>`
              )
              .join(
                "\n\n"
              );

          return message.reply({
            embeds: [
              glassEmbed(
                `🛡️ Warnings • ${member.user.tag}`,
                text,
                COLORS.warning
              )
            ]
          });
        }

        /* ================= CLEAR WARNS ================= */

        if (
          command ===
          "clearwarns"
        ) {
          const member =
            getMentionedMember(
              message,
              args[0]
            ) ||
            await message.guild.members
              .fetch(args[0])
              .catch(() => null);

          if (!member) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "No encontré a ese usuario."
                )
              ]
            });
          }

          data.moderation
            .warnings[
              message.guild.id
            ] ??= {};

          data.moderation
            .warnings[
              message.guild.id
            ][member.id] = [];

          saveData();

          return message.reply({
            embeds: [
              successEmbed(
                `Se eliminaron todas las advertencias de ${member.user.tag}.`
              )
            ]
          });
        }

        /* ================= CHANNEL CONFIG ================= */

        const configs = {
          bienvenidaset: [
            "welcomeChannel",
            "bienvenidas"
          ],
          inviteset: [
            "inviteChannel",
            "invitaciones"
          ],
          niveleset: [
            "levelChannel",
            "niveles"
          ],
          alianzaset: [
            "allianceChannel",
            "alianzas"
          ],
          affysset: [
            "affysChannel",
            "affys"
          ],
          surgeset: [
            "suggestionChannel",
            "sugerencias"
          ]
        };

        if (configs[command]) {
          const channel =
            parseChannel(
              message,
              args[0]
            );

          if (!channel) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "Debes mencionar un canal válido."
                )
              ]
            });
          }

          const [
            key,
            name
          ] = configs[command];

          const settings =
            getGuildSettings(
              data,
              message.guild.id
            );

          settings[key] =
            channel.id;

          saveData();

          return message.reply({
            embeds: [
              successEmbed(
                `Canal de **${name}** configurado en ${channel}.`
              )
            ]
          });
        }

        /* ================= HONEYPOT SET ================= */

        if (
          command ===
          "honeypotset"
        ) {
          const channel =
            parseChannel(
              message,
              args[0]
            );

          if (!channel) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "Debes mencionar un canal válido."
                )
              ]
            });
          }

          await setupHoneypot(
            message.guild,
            channel,
            data,
            saveData
          );

          return message.reply({
            embeds: [
              successEmbed(
                `Honeypot configurado en ${channel}.`
              )
            ]
          });
        }

        /* ================= LOG CHANNELS ================= */

        if (
          command ===
          "valoraciones" ||
          command ===
          "transaccion" ||
          command ===
          "ticketlogs"
        ) {
          const channel =
            parseChannel(
              message,
              args[0]
            );

          if (!channel) {
            return message.reply({
              embeds: [
                errorEmbed(
                  "Canal inválido."
                )
              ]
            });
          }

          const key =
            command ===
            "valoraciones"
              ? "valoraciones"
              : command ===
                  "transaccion"
                ? "transacciones"
                : "tickets";

          data.ticketSystem
            .logs[key] =
            channel.id;

          saveData();

          return message.reply({
            embeds: [
              successEmbed(
                `Canal configurado en ${channel}.`
              )
            ]
          });
        }
      } catch (error) {
        console.error(
          "[LRM ADMIN PREFIX ERROR]",
          error
        );
      }
    }
  );

  /* =====================================================
     INTERACTIONS
     ===================================================== */

  client.on(
    "interactionCreate",
    async interaction => {
      try {
        /* ================= HELP MENU ================= */

        if (
          interaction.isStringSelectMenu() &&
          interaction.customId ===
            "lrm_help_menu"
        ) {
          return interaction.update({
            embeds: [
              helpEmbed(
                interaction.values[0]
              )
            ],
            components: [
              helpMenu()
            ]
          });
        }

        /* ================= ADMIN MENU ================= */

        if (
          interaction.isStringSelectMenu() &&
          interaction.customId ===
            "lrm_admin_menu"
        ) {
          if (
            !discordAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Necesitas permisos de Administrador."
                )
              ],
              flags:
                MessageFlags.Ephemeral
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

        /* ================= TICKET OPEN ================= */

        if (
          interaction.isButton() &&
          interaction.customId.startsWith(
            "ticket_open_"
          )
        ) {
          const key =
            interaction.customId.replace(
              "ticket_open_",
              ""
            );

          const panel =
            data.ticketSystem
              .panels[key];

          if (!panel) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Este panel ya no existe."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          return createTicket({
            interaction,
            panel,
            data,
            saveData
          });
        }

        /* ================= TICKET CLAIM ================= */

        if (
          interaction.isButton() &&
          interaction.customId ===
            "ticket_claim"
        ) {
          const ticket =
            data.ticketSystem
              .openTickets
              ?.[interaction.guild.id]
              ?.[interaction.channel.id];

          if (!ticket) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Este canal no es un ticket."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          if (
            !canManage(
              data,
              interaction.member,
              "reclamar_ticket"
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "No tienes permiso para reclamar tickets."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          if (
            ticket.claimedBy
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  `Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          ticket.claimedBy =
            interaction.user.id;

          saveData();

          return interaction.reply({
            embeds: [
              successEmbed(
                `${interaction.user} ha reclamado este ticket.`
              )
            ]
          });
        }

        /* ================= TICKET CLOSE ================= */

        if (
          interaction.isButton() &&
          interaction.customId ===
            "ticket_close"
        ) {
          return requestTicketClose(
            interaction,
            data
          );
        }

        /* ================= RATING ================= */

        if (
          interaction.isButton() &&
          interaction.customId.startsWith(
            "ticket_rate_"
          )
        ) {
          const rating =
            Number(
              interaction.customId.replace(
                "ticket_rate_",
                ""
              )
            );

          const ticket =
            data.ticketSystem
              .openTickets
              ?.[interaction.guild.id]
              ?.[interaction.channel.id];

          if (!ticket) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "El ticket ya no existe."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const logId =
            data.ticketSystem
              .logs.valoraciones;

          if (logId) {
            const channel =
              interaction.guild.channels.cache.get(
                logId
              );

            if (channel) {
              await channel.send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(
                      COLORS.warning
                    )
                    .setTitle(
                      "⭐ Nueva valoración"
                    )
                    .addFields(
                      {
                        name: "Usuario",
                        value:
                          `${interaction.user}`,
                        inline: true
                      },
                      {
                        name:
                          "Valoración",
                        value:
                          `${rating}/5`,
                        inline: true
                      },
                      {
                        name:
                          "Ticket",
                        value:
                          `<#${interaction.channel.id}>`,
                        inline: true
                      }
                    )
                    .setFooter({
                      text:
                        "LRM Studio • Fluent Glass"
                    })
                ]
              }).catch(
                () => {}
              );
            }
          }

          delete data
            .ticketSystem
            .openTickets[
              interaction.guild.id
            ][
              interaction.channel.id
            ];

          saveData();

          await interaction.update({
            embeds: [
              successEmbed(
                `Gracias por tu valoración: **${rating}/5** ⭐\nEste ticket se cerrará en unos segundos.`
              )
            ],
            components: []
          });

          setTimeout(
            () =>
              interaction.channel
                .delete()
                .catch(() => {}),
            5000
          );

          return;
        }

        /* ================= SLASH ================= */

        if (
          !interaction.isChatInputCommand()
        ) {
          return;
        }

        const command =
          interaction.commandName;

        /* ================= ADMIN ================= */

        if (command === "admin") {
          if (
            !discordAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Necesitas permisos de Administrador."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          return interaction.reply({
            embeds: [
              adminEmbed()
            ],
            components: [
              adminMenu()
            ]
          });
        }

        /* ================= PANEL ================= */

        if (command === "panel") {
          if (
            !discordAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Necesitas permisos de Administrador."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const name =
            interaction.options.getString(
              "nombre"
            );

          const messageText =
            interaction.options.getString(
              "mensaje_panel"
            );

          const questionsText =
            interaction.options.getString(
              "preguntas"
            );

          const emoji =
            interaction.options.getString(
              "emoji"
            ) || "🎫";

          const welcome =
            interaction.options.getString(
              "mensaje_ingreso"
            );

          const questions =
            questionsText
              .split("|")
              .map(x =>
                x.trim()
              )
              .filter(Boolean);

          const q1 =
            interaction.options.getString(
              "pregunta1"
            );

          const q2 =
            interaction.options.getString(
              "pregunta2"
            );

          if (q1) questions.push(q1);
          if (q2) questions.push(q2);

          const key =
            panelKey(name);

          data.ticketSystem.panels[
            key
          ] = {
            key,
            name,
            message:
              messageText,
            questions,
            emoji:
              parseMenuEmoji(
                emoji
              ),
            welcomeMessage:
              welcome
          };

          saveData();

          return interaction.reply({
            embeds: [
              successEmbed(
                `Panel **${name}** creado.\nClave: \`${key}\``
              )
            ],
            flags:
              MessageFlags.Ephemeral
          });
        }

        /* ================= TICKET PANEL ================= */

        if (
          command ===
          "ticketpanel"
        ) {
          if (
            !canManage(
              data,
              interaction.member,
              "gestionar_tickets"
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "No tienes permiso para gestionar tickets."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const channel =
            interaction.options.getChannel(
              "canal"
            );

          const key =
            interaction.options.getString(
              "panel"
            );

          const panel =
            data.ticketSystem
              .panels[key];

          if (!panel) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Ese panel no existe."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const button =
            new ButtonBuilder()
              .setCustomId(
                `ticket_open_${panel.key}`
              )
              .setLabel(
                "Abrir ticket"
              )
              .setEmoji(
                panel.emoji ||
                  "🎫"
              )
              .setStyle(
                ButtonStyle.Primary
              );

          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(
                  COLORS.primary
                )
                .setTitle(
                  `🎫 ${panel.name}`
                )
                .setDescription(
                  panel.message
                )
                .setFooter({
                  text:
                    "LRM Studio • Fluent Glass"
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
                `Panel publicado en ${channel}.`
              )
            ],
            flags:
              MessageFlags.Ephemeral
          });
        }

        /* ================= STAFF ================= */

        if (command === "staff") {
          if (
            !discordAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Necesitas permisos de Administrador."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const role =
            interaction.options.getRole(
              "rol"
            );

          const permission =
            interaction.options.getString(
              "permiso"
            );

          const action =
            interaction.options.getString(
              "accion"
            ) || "add";

          data.ticketSystem
            .staffRoles[
              interaction.guild.id
            ] ??= {};

          data.ticketSystem
            .staffRoles[
              interaction.guild.id
            ][role.id] ??= {};

          if (
            action === "remove"
          ) {
            delete data
              .ticketSystem
              .staffRoles[
                interaction.guild.id
              ][role.id][
                permission
              ];
          } else {
            data
              .ticketSystem
              .staffRoles[
                interaction.guild.id
              ][role.id][
                permission
              ] = true;
          }

          saveData();

          return interaction.reply({
            embeds: [
              successEmbed(
                `${role} → \`${permission}\` → **${action}**`
              )
            ],
            flags:
              MessageFlags.Ephemeral
          });
        }

        /* ================= LOG CONFIG ================= */

        const logCommands = {
          valoraciones:
            "valoraciones",
          transaccion:
            "transacciones",
          ticketlogs:
            "tickets"
        };

        if (
          logCommands[command]
        ) {
          if (
            !discordAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Necesitas permisos de Administrador."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const channel =
            interaction.options.getChannel(
              "canal"
            );

          data.ticketSystem
            .logs[
              logCommands[
                command
              ]
            ] = channel.id;

          saveData();

          return interaction.reply({
            embeds: [
              successEmbed(
                `Configurado en ${channel}.`
              )
            ],
            flags:
              MessageFlags.Ephemeral
          });
        }

        /* ================= MODERATION ================= */

        const moderationCommands = [
          "ban",
          "kick",
          "mute",
          "unmute",
          "unban",
          "purge",
          "warn",
          "warnings",
          "clearwarns"
        ];

        if (
          moderationCommands.includes(
            command
          )
        ) {
          if (
            !canManage(
              data,
              interaction.member,
              command
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "No tienes permiso para usar este comando."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }
        }

        /* ================= BAN ================= */

        if (command === "ban") {
          const user =
            interaction.options.getUser(
              "usuario"
            );

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (member) {
            const problem =
              checkModerationTarget(
                interaction.guild,
                interaction.user.id,
                member
              );

            if (problem) {
              return interaction.reply({
                embeds: [
                  errorEmbed(
                    problem
                  )
                ],
                flags:
                  MessageFlags.Ephemeral
              });
            }

            if (!member.bannable) {
              return interaction.reply({
                embeds: [
                  errorEmbed(
                    "No puedo banear a ese usuario."
                  )
                ],
                flags:
                  MessageFlags.Ephemeral
              });
            }
          }

          const reason =
            interaction.options.getString(
              "razon"
            ) ||
            "Sin razón especificada";

          await interaction.guild.members.ban(
            user.id,
            { reason }
          );

          return interaction.reply({
            embeds: [
              successEmbed(
                `${user.tag} fue baneado.\n**Razón:** ${reason}`
              )
            ]
          });
        }

        /* ================= KICK ================= */

        if (command === "kick") {
          const user =
            interaction.options.getUser(
              "usuario"
            );

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Ese usuario no está en el servidor."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const problem =
            checkModerationTarget(
              interaction.guild,
              interaction.user.id,
              member
            );

          if (problem) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  problem
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          if (!member.kickable) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "No puedo expulsar a ese usuario."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const reason =
            interaction.options.getString(
              "razon"
            ) ||
            "Sin razón especificada";

          await member.kick(
            reason
          );

          return interaction.reply({
            embeds: [
              successEmbed(
                `${user.tag} fue expulsado.\n**Razón:** ${reason}`
              )
            ]
          });
        }

        /* ================= MUTE / UNMUTE ================= */

        if (
          command === "mute" ||
          command === "unmute"
        ) {
          const user =
            interaction.options.getUser(
              "usuario"
            );

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (!member) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Ese usuario no está en el servidor."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const problem =
            checkModerationTarget(
              interaction.guild,
              interaction.user.id,
              member
            );

          if (problem) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  problem
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          if (!member.moderatable) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "No puedo modificar el timeout de ese usuario."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          if (command === "mute") {
            const minutes =
              interaction.options.getInteger(
                "minutos"
              );

            const reason =
              interaction.options.getString(
                "razon"
              ) ||
              "Sin razón especificada";

            await member.timeout(
              minutes * 60000,
              reason
            );

            return interaction.reply({
              embeds: [
                successEmbed(
                  `${user.tag} fue silenciado durante **${minutes} minutos**.`
                )
              ]
            });
          }

          const reason =
            interaction.options.getString(
              "razon"
            ) ||
            "Timeout eliminado";

          await member.timeout(
            null,
            reason
          );

          return interaction.reply({
            embeds: [
              successEmbed(
                `Timeout eliminado para ${user.tag}.`
              )
            ]
          });
        }

        /* ================= UNBAN ================= */

        if (
          command === "unban"
        ) {
          const id =
            interaction.options.getString(
              "usuario_id"
            );

          if (
            !/^\d{17,20}$/.test(
              id
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "ID de usuario inválida."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const reason =
            interaction.options.getString(
              "razon"
            ) ||
            "Desbaneado por staff";

          await interaction.guild.members
            .unban(
              id,
              reason
            );

          return interaction.reply({
            embeds: [
              successEmbed(
                `Usuario \`${id}\` desbaneado.`
              )
            ]
          });
        }

        /* ================= PURGE ================= */

        if (
          command === "purge"
        ) {
          const amount =
            interaction.options.getInteger(
              "cantidad"
            );

          const deleted =
            await interaction.channel
              .bulkDelete(
                amount,
                true
              );

          return interaction.reply({
            embeds: [
              successEmbed(
                `Se eliminaron **${deleted.size}** mensajes.`
              )
            ],
            flags:
              MessageFlags.Ephemeral
          });
        }

        /* ================= WARN ================= */

        if (
          command === "warn"
        ) {
          const user =
            interaction.options.getUser(
              "usuario"
            );

          const member =
            await interaction.guild.members
              .fetch(user.id)
              .catch(() => null);

          if (member) {
            const problem =
              checkModerationTarget(
                interaction.guild,
                interaction.user.id,
                member
              );

            if (problem) {
              return interaction.reply({
                embeds: [
                  errorEmbed(
                    problem
                  )
                ],
                flags:
                  MessageFlags.Ephemeral
              });
            }
          }

          const reason =
            interaction.options.getString(
              "razon"
            );

          const warnings =
            ensureWarnings(
              data,
              interaction.guild.id,
              user.id
            );

          warnings.push({
            reason,
            moderatorId:
              interaction.user.id,
            timestamp:
              Date.now()
          });

          saveData();

          return interaction.reply({
            embeds: [
              successEmbed(
                `${user.tag} recibió una advertencia.\n**Razón:** ${reason}\n**Warnings:** ${warnings.length}`
              )
            ]
          });
        }

        /* ================= WARNINGS ================= */

        if (
          command ===
          "warnings"
        ) {
          const user =
            interaction.options.getUser(
              "usuario"
            ) ||
            interaction.user;

          const warnings =
            ensureWarnings(
              data,
              interaction.guild.id,
              user.id
            );

          if (!warnings.length) {
            return interaction.reply({
              embeds: [
                glassEmbed(
                  "🛡️ Warnings",
                  `${user.tag} no tiene advertencias.`,
                  COLORS.info
                )
              ]
            });
          }

          const text =
            warnings
              .slice(-10)
              .map(
                (w, i) =>
                  `**${i + 1}.** ${w.reason}\n> <@${w.moderatorId}> • <t:${Math.floor(w.timestamp / 1000)}:R>`
              )
              .join(
                "\n\n"
              );

          return interaction.reply({
            embeds: [
              glassEmbed(
                `🛡️ Warnings • ${user.tag}`,
                text,
                COLORS.warning
              )
            ]
          });
        }

        /* ================= CLEAR WARNS ================= */

        if (
          command ===
          "clearwarns"
        ) {
          const user =
            interaction.options.getUser(
              "usuario"
            );

          data.moderation
            .warnings[
              interaction.guild.id
            ] ??= {};

          data.moderation
            .warnings[
              interaction.guild.id
            ][user.id] = [];

          saveData();

          return interaction.reply({
            embeds: [
              successEmbed(
                `Se eliminaron las advertencias de ${user.tag}.`
              )
            ]
          });
        }

        /* ================= CONFIG ================= */

        const configSlash = {
          bienvenidaset: [
            "welcomeChannel",
            "bienvenidas"
          ],
          inviteset: [
            "inviteChannel",
            "invitaciones"
          ],
          niveleset: [
            "levelChannel",
            "niveles"
          ],
          alianzaset: [
            "allianceChannel",
            "alianzas"
          ],
          affysset: [
            "affysChannel",
            "affys"
          ],
          surgeset: [
            "suggestionChannel",
            "sugerencias"
          ]
        };

        if (
          configSlash[command]
        ) {
          if (
            !discordAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Necesitas permisos de Administrador."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const [
            key,
            name
          ] =
            configSlash[
              command
            ];

          const channel =
            interaction.options.getChannel(
              "canal"
            );

          const settings =
            getGuildSettings(
              data,
              interaction.guild.id
            );

          settings[key] =
            channel.id;

          saveData();

          return interaction.reply({
            embeds: [
              successEmbed(
                `Canal de **${name}** configurado en ${channel}.`
              )
            ],
            flags:
              MessageFlags.Ephemeral
          });
        }

        /* ================= HONEYPOT ================= */

        if (
          command ===
          "honeypotset"
        ) {
          if (
            !discordAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              embeds: [
                errorEmbed(
                  "Necesitas permisos de Administrador."
                )
              ],
              flags:
                MessageFlags.Ephemeral
            });
          }

          const channel =
            interaction.options.getChannel(
              "canal"
            );

          await setupHoneypot(
            interaction.guild,
            channel,
            data,
            saveData
          );

          return interaction.reply({
            embeds: [
              successEmbed(
                `Honeypot configurado en ${channel}.`
              )
            ],
            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch (error) {
        console.error(
          "[LRM ADMIN ERROR]",
          error
        );

        if (
          interaction.isRepliable() &&
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            embeds: [
              errorEmbed(
                "Ocurrió un error al ejecutar esta acción."
              )
            ],
            flags:
              MessageFlags.Ephemeral
          }).catch(
            () => {}
          );
        }
      }
    }
  );

  /* =====================================================
     STARTUP
     ===================================================== */

  client.once(
    "clientReady",
    async () => {
      ensureData(data);

      for (
        const guild of client.guilds.cache.values()
      ) {
        const config =
          data.honeypot
            ?.guilds
            ?.[guild.id];

        if (!config) continue;

        await updateHoneypotMessage(
          guild,
          config
        );
      }

      console.log(
        "[LRM Studio] Sistema administrativo cargado."
      );
    }
  );
}

/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  setupAdmin,
  adminCommands
};

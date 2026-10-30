const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

/* =========================================================
   LRM STUDIO — ADMIN SYSTEM
   SIN ECONOMÍA
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
  warning: "⚠",
  error: "×",
  success: "✓",
  info: "◉",
  admin: "⚙",
  logs: "⌁",
  arrow: "›",
  user: "○",
  random: "◆"
};

const DEFAULT_HONEYPOT_MESSAGE = `🍯・Honeypot

Este canal forma parte del sistema de seguridad de LRM Studio.

⚠️ No interactúes con este canal.

Cualquier interacción será detectada automáticamente y podrá activar las medidas de seguridad del servidor.

🛡️ LRM Studio Security`;

/* =========================================================
   SLASH COMMANDS
   ========================================================= */

const adminCommands = [

  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Abre el panel administrativo de LRM Studio"),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Crea un panel de tickets")
    .addStringOption(o =>
      o.setName("nombre")
        .setDescription("Nombre del panel")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensaje_panel")
        .setDescription("Mensaje del panel")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("preguntas")
        .setDescription("Preguntas separadas por |")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("emoji")
        .setDescription("Emoji del botón")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensaje_ingreso")
        .setDescription("Mensaje al crear ticket")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("pregunta1")
        .setDescription("Pregunta adicional")
        .setRequired(false)
    )
    .addStringOption(o =>
      o.setName("pregunta2")
        .setDescription("Segunda pregunta adicional")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Publica un panel de tickets")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal donde se publicará")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("panel")
        .setDescription("Panel que quieres publicar")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Configura permisos de un rol de staff")
    .addRoleOption(o =>
      o.setName("rol")
        .setDescription("Rol")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("permiso")
        .setDescription("Permiso")
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
        .setRequired(false)
        .addChoices(
          { name: "Agregar", value: "add" },
          { name: "Quitar", value: "remove" }
        )
    ),

  new SlashCommandBuilder()
    .setName("valoraciones")
    .setDescription("Configura el canal de valoraciones")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("transaccion")
    .setDescription("Configura el canal de transacciones")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticketlogs")
    .setDescription("Configura el canal de logs de tickets")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un usuario")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa a un usuario")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silencia a un usuario")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutos")
        .setDescription("Duración")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Quita el timeout")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Desbanea mediante ID")
    .addStringOption(o =>
      o.setName("usuario_id").setDescription("ID del usuario").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Elimina mensajes")
    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription("1-100")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Advierte a un usuario")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Muestra las advertencias")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("clearwarns")
    .setDescription("Elimina las advertencias")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("bienvenidaset")
    .setDescription("Configura las bienvenidas")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("inviteset")
    .setDescription("Configura el sistema de invitaciones")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("niveleset")
    .setDescription("Configura los anuncios de niveles")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("alianzaset")
    .setDescription("Configura alianzas")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("affysset")
    .setDescription("Configura affys")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("honeypotset")
    .setDescription("Configura Honeypot")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("surgeset")
    .setDescription("Configura sugerencias")
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
].map(x => x.toJSON());


/* =========================================================
   HELP
   ========================================================= */

const HELP_CATEGORIES = {

  help: {
    name: "📚 Help",
    description: "Ayuda y comandos generales",
    commands: [
      [".help", "Abrir este menú"],
      [".admin", "Panel administrativo"],
      [".ping", "Ver latencia"],
      [".uptime", "Ver tiempo activo"],
      [".membercount", "Ver miembros"],
      [".servericon", "Ver icono"],
      [".serverinfo", "Información del servidor"],
      [".userinfo", "Información de usuario"],
      [".roleinfo", "Información de un rol"],
      [".channelinfo", "Información de un canal"]
    ]
  },

  diversion: {
    name: "🎮 Diversión",
    description: "Comandos para divertirte",
    commands: [
      [".dice", "Lanzar un dado"],
      [".choose", "Elegir entre opciones"],
      [".rps", "Piedra, papel o tijera"],
      [".reverse", "Invertir un texto"],
      [".8ball", "Preguntar a la bola 8"],
      [".coinflip", "Lanzar una moneda"],
      [".random", "Número aleatorio"],
      [".ship", "Compatibilidad entre usuarios"],
      [".say", "Hacer que el bot diga algo"],
      [".avatar", "Ver avatar de un usuario"]
    ]
  },

  rank: {
    name: "🏆 Rank",
    description: "Niveles y clasificación",
    commands: [
      [".rank", "Ver tu rango"],
      [".rank @usuario", "Ver rango de otro usuario"],
      [".level", "Ver tu nivel"],
      [".xp", "Ver tu XP"],
      [".top rank", "Top de niveles"],
      [".top level", "Top de niveles"],
      [".invitever", "Ver tus invitaciones"],
      [".top invite", "Top de invitaciones"],
      [".top alliance", "Top de alianzas"],
      [".top affy", "Top de affys"]
    ]
  },

  top: {
    name: "📊 Top",
    description: "Clasificaciones del servidor",
    commands: [
      [".top", "Abrir menú de Tops"],
      [".top rank", "Top de niveles"],
      [".top level", "Top de XP/nivel"],
      [".top invite", "Top de invitaciones"],
      [".top alliance", "Top de alianzas"],
      [".top affy", "Top de affys"],
      [".top messages", "Top de mensajes"],
      [".top voice", "Top de actividad de voz"],
      [".top wins", "Top de victorias"],
      [".top all", "Resumen de clasificaciones"]
    ]
  },

  info: {
    name: "ℹ️ Info",
    description: "Información",
    commands: [
      [".ping", "Latencia"],
      [".uptime", "Tiempo activo"],
      [".membercount", "Cantidad de miembros"],
      [".servericon", "Icono del servidor"],
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
    description: "Moderación del servidor",
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
      [".admin", "Panel de administración"]
    ]
  },

  tickets: {
    name: "🎫 Tickets",
    description: "Sistema de tickets",
    commands: [
      [".ticketpanel", "Publicar panel"],
      [".panel", "Crear panel"],
      [".staff", "Configurar staff"],
      [".valoraciones", "Canal de valoraciones"],
      [".ticketlogs", "Logs de tickets"],
      [".transaccion", "Logs de transacciones"],
      [".admin", "Administrar tickets"],
      ["Reclamar", "Botón de reclamar"],
      ["Cerrar", "Botón de cerrar"],
      ["Valorar", "Valoración 1-5"],
      ["Gestionar", "Gestión del ticket"]
    ]
  },

  configuration: {
    name: "⚙️ Configuración",
    description: "Configuración del servidor",
    commands: [
      [".bienvenidaset", "Configurar bienvenidas"],
      [".inviteset", "Configurar invitaciones"],
      [".niveleset", "Configurar niveles"],
      [".alianzaset", "Configurar alianzas"],
      [".affysset", "Configurar affys"],
      [".honeypotset", "Configurar Honeypot"],
      [".surgeset", "Configurar sugerencias"],
      [".staff", "Configurar staff"],
      [".ticketlogs", "Configurar logs"],
      [".valoraciones", "Configurar valoraciones"]
    ]
  }
};


/* =========================================================
   HELP MENU
   ========================================================= */

function helpEmbed(category = "help") {

  const info = HELP_CATEGORIES[category] || HELP_CATEGORIES.help;

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(`${info.name} • LRM Studio`)
    .setDescription(info.description)
    .setFooter({ text: "LRM Studio • Fluent Glass" });

  for (const [command, description] of info.commands) {
    embed.addFields({
      name: `\`${command}\``,
      value: description,
      inline: true
    });
  }

  return embed;
}

function helpMenu() {

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("lrm_help_menu")
      .setPlaceholder("Selecciona una categoría")
      .addOptions(
        {
          label: "Help",
          description: "Ayuda y comandos generales",
          value: "help",
          emoji: "📚"
        },
        {
          label: "Diversión",
          description: "Comandos divertidos",
          value: "diversion",
          emoji: "🎮"
        },
        {
          label: "Rank",
          description: "Niveles y clasificación",
          value: "rank",
          emoji: "🏆"
        },
        {
          label: "Top",
          description: "Clasificaciones",
          value: "top",
          emoji: "📊"
        },
        {
          label: "Info",
          description: "Información",
          value: "info",
          emoji: "ℹ️"
        },
        {
          label: "Moderación",
          description: "Comandos de moderación",
          value: "moderation",
          emoji: "🛡️"
        },
        {
          label: "Tickets",
          description: "Sistema de tickets",
          value: "tickets",
          emoji: "🎫"
        },
        {
          label: "Configuración",
          description: "Configuración",
          value: "configuration",
          emoji: "⚙️"
        }
      )
  );
}


/* =========================================================
   ADMIN MENU
   ========================================================= */

function adminEmbed(category = "main") {

  if (category === "moderation") {
    return new EmbedBuilder()
      .setColor(COLORS.error)
      .setTitle("🛡️ Moderación • LRM Studio")
      .setDescription(
        "Herramientas administrativas de moderación.\n\n" +
        "Selecciona una opción del menú."
      )
      .setFooter({ text: "LRM Studio • Fluent Glass" });
  }

  if (category === "tickets") {
    return new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle("🎫 Tickets • LRM Studio")
      .setDescription(
        "Gestiona el sistema de tickets, staff y logs."
      )
      .setFooter({ text: "LRM Studio • Fluent Glass" });
  }

  if (category === "configuration") {
    return new EmbedBuilder()
      .setColor(COLORS.admin)
      .setTitle("⚙️ Configuración • LRM Studio")
      .setDescription(
        "Configura los sistemas principales del servidor."
      )
      .setFooter({ text: "LRM Studio • Fluent Glass" });
  }

  if (category === "security") {
    return new EmbedBuilder()
      .setColor(COLORS.warning)
      .setTitle("🍯 Seguridad • LRM Studio")
      .setDescription(
        "Herramientas de seguridad y protección."
      )
      .setFooter({ text: "LRM Studio • Fluent Glass" });
  }

  return new EmbedBuilder()
    .setColor(COLORS.admin)
    .setTitle("⚙️ Administración • LRM Studio")
    .setDescription(
      "Bienvenido al panel administrativo.\n\n" +
      "Selecciona una categoría para ver sus herramientas."
    )
    .setFooter({ text: "LRM Studio • Fluent Glass" });
}

function adminMenu() {

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("lrm_admin_menu")
      .setPlaceholder("Selecciona una categoría")
      .addOptions(
        {
          label: "Moderación",
          description: "Ban, kick, mute, warns y purge",
          value: "moderation",
          emoji: "🛡️"
        },
        {
          label: "Tickets",
          description: "Paneles, staff y logs",
          value: "tickets",
          emoji: "🎫"
        },
        {
          label: "Configuración",
          description: "Configurar sistemas",
          value: "configuration",
          emoji: "⚙️"
        },
        {
          label: "Seguridad",
          description: "Honeypot y seguridad",
          value: "security",
          emoji: "🍯"
        }
      )
  );
}


/* =========================================================
   HELPERS
   ========================================================= */

function glassEmbed(title, description, color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "LRM Studio • Fluent Glass" });
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
  const matches = content.match(/"[^"]+"|'[^']+'|\S+/g) || [];

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

function getMentionedMember(message, text) {

  const mention = text?.match(/^<@!?(\d+)>$/);

  if (!mention) return null;

  return message.guild.members.cache.get(mention[1]) || null;
}

function parseChannel(message, value) {

  if (!value) return null;

  const mention = value.match(/^<#(\d+)>$/);

  if (mention) {
    return message.guild.channels.cache.get(mention[1]) || null;
  }

  return message.guild.channels.cache.get(value) || null;
}

function parseRole(message, value) {

  if (!value) return null;

  const mention = value.match(/^<@&(\d+)>$/);

  if (mention) {
    return message.guild.roles.cache.get(mention[1]) || null;
  }

  return message.guild.roles.cache.get(value) || null;
}

function ensureData(data) {

  data.ticketSystem ??= {};
  data.ticketSystem.panels ??= {};
  data.ticketSystem.staffRoles ??= {};
  data.ticketSystem.openTickets ??= {};
  data.ticketSystem.logs ??= {};

  data.guildSettings ??= {};

  data.honeypot ??= {
    message: DEFAULT_HONEYPOT_MESSAGE,
    guilds: {}
  };

  data.honeypot.guilds ??= {};

  data.invites ??= {
    guilds: {}
  };

  data.invites.guilds ??= {};

  data.partners ??= {
    guilds: {}
  };

  data.partners.guilds ??= {};

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

function discordAdmin(member) {

  if (!member) return false;

  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.guild.ownerId === member.id
  );
}

function getRolePermissions(data, guildId, roleId) {

  data.ticketSystem ??= {};
  data.ticketSystem.staffRoles ??= {};
  data.ticketSystem.staffRoles[guildId] ??= {};

  return data.ticketSystem.staffRoles[guildId][roleId] || {};
}

function hasStaffPermission(data, member, permission) {

  if (!member) return false;

  if (discordAdmin(member)) return true;

  if (member.roles.cache.has(STAFF_ROLE_ID)) return true;

  const roles = data.ticketSystem?.staffRoles?.[member.guild.id] || {};

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

function canManage(data, member, permission) {
  return discordAdmin(member) || hasStaffPermission(data, member, permission);
}


/* =========================================================
   MODERATION
   ========================================================= */

function ensureWarnings(data, guildId, userId) {

  data.moderation ??= {};
  data.moderation.warnings ??= {};
  data.moderation.warnings[guildId] ??= {};
  data.moderation.warnings[guildId][userId] ??= [];

  return data.moderation.warnings[guildId][userId];
}

async function moderateTarget(message, target) {

  if (!target) {
    return "No encontré a ese usuario.";
  }

  if (target.id === message.guild.ownerId) {
    return "No puedes moderar al dueño del servidor.";
  }

  if (target.id === message.author.id) {
    return "No puedes moderarte a vos mismo.";
  }

  if (
    message.member.roles.highest.position <=
    target.roles.highest.position &&
    message.guild.ownerId !== message.author.id
  ) {
    return "El rol del usuario está al mismo nivel o por encima del tuyo.";
  }

  if (
    message.guild.members.me &&
    message.guild.members.me.roles.highest.position <=
    target.roles.highest.position
  ) {
    return "Mi rol está por debajo del rol de ese usuario.";
  }

  return null;
}

async function doBan(guild, user, reason, moderator) {

  const member = await guild.members.fetch(user.id).catch(() => null);

  if (member) {

    const problem = await moderateTarget(
      {
        guild,
        author: moderator.user,
        member
      },
      member
    );

    if (problem) return problem;

    if (!member.bannable) {
      return "No puedo banear a ese usuario.";
    }
  }

  await guild.members.ban(user.id, {
    reason: reason || `Moderado por ${moderator.user.tag}`
  });

  return null;
}

async function doKick(guild, member, reason, moderator) {

  const problem = await moderateTarget(
    {
      guild,
      author: moderator.user,
      member
    },
    member
  );

  if (problem) return problem;

  if (!member.kickable) {
    return "No puedo expulsar a ese usuario.";
  }

  await member.kick(
    reason || `Moderado por ${moderator.user.tag}`
  );

  return null;
}


/* =========================================================
   HONEYPOT
   ========================================================= */

async function updateHoneypotMessage(guild, config) {

  const channel = guild.channels.cache.get(config.channelId);

  if (!channel) return;

  const message = await channel.messages
    .fetch(config.messageId)
    .catch(() => null);

  if (!message) return;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("honeypot_counter")
      .setLabel(`Ban: ${config.bans || 0}`)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );

  await message.edit({
    content: DEFAULT_HONEYPOT_MESSAGE,
    components: [row]
  }).catch(() => {});
}

async function setupHoneypot(guild, channel, data, saveData) {

  data.honeypot ??= {
    message: DEFAULT_HONEYPOT_MESSAGE,
    guilds: {}
  };

  data.honeypot.guilds ??= {};

  const old = data.honeypot.guilds[guild.id];

  if (old?.messageId) {

    const oldChannel = guild.channels.cache.get(old.channelId);

    if (oldChannel) {
      const oldMessage = await oldChannel.messages
        .fetch(old.messageId)
        .catch(() => null);

      if (oldMessage) {
        await oldMessage.delete().catch(() => {});
      }
    }
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("honeypot_counter")
      .setLabel("Ban: 0")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );

  const sent = await channel.send({
    content: DEFAULT_HONEYPOT_MESSAGE,
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
   TICKET SYSTEM
   ========================================================= */

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

  const custom = emoji.match(/^<a?:\w+:(\d+)>$/);

  if (custom) return emoji;

  return emoji;
}

function getTicketViewerRoles(data, guildId) {

  const result = [];

  const roles = data.ticketSystem?.staffRoles?.[guildId] || {};

  for (const [roleId, permissions] of Object.entries(roles)) {

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

  const open = data.ticketSystem.openTickets[guild.id] || {};

  for (const ticket of Object.values(open)) {

    if (
      ticket.userId === user.id &&
      ticket.panel === panel.key
    ) {

      const existing = guild.channels.cache.get(ticket.channelId);

      if (existing) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `Ya tienes un ticket abierto: ${existing}`
            )
          ],
          ephemeral: true
        });
      }
    }
  }

  const viewerRoles = getTicketViewerRoles(
    data,
    guild.id
  );

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
    }
  ];

  for (const roleId of viewerRoles) {

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

  overwrites.push({
    id: STAFF_ROLE_ID,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks
    ]
  });

  const channel = await guild.channels.create({
    name: `ticket-${user.username}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .slice(0, 90),
    type: ChannelType.GuildText,
    permissionOverwrites: overwrites
  });

  const ticketId = `${guild.id}-${channel.id}`;

  data.ticketSystem.openTickets[guild.id] ??= {};

  data.ticketSystem.openTickets[guild.id][channel.id] = {
    userId: user.id,
    panel: panel.key,
    channelId: channel.id,
    claimedBy: null,
    createdAt: Date.now(),
    ticketId
  };

  saveData();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Reclamar")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Cerrar")
      .setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(`🎫 ${panel.name}`)
    .setDescription(
      panel.welcomeMessage ||
      "Gracias por abrir un ticket. Un miembro del equipo te atenderá pronto."
    )
    .setFooter({
      text: "LRM Studio • Fluent Glass"
    });

  await channel.send({
    content: `${user} <@&${STAFF_ROLE_ID}>`,
    embeds: [embed],
    components: [buttons]
  });

  await interaction.reply({
    embeds: [
      successEmbed(
        `Tu ticket fue creado correctamente: ${channel}`
      )
    ],
    ephemeral: true
  });
}

async function requestTicketClose(
  interaction,
  data,
  saveData
) {

  const ticket =
    data.ticketSystem?.openTickets?.[
      interaction.guild.id
    ]?.[interaction.channel.id];

  if (!ticket) {

    return interaction.reply({
      embeds: [
        errorEmbed(
          "Este canal no es un ticket válido."
        )
      ],
      ephemeral: true
    });
  }

  if (
    !canManage(
      data,
      interaction.member,
      "cerrar_ticket"
    ) &&
    ticket.userId !== interaction.user.id
  ) {

    return interaction.reply({
      embeds: [
        errorEmbed(
          "No tienes permiso para cerrar este ticket."
        )
      ],
      ephemeral: true
    });
  }

  const row = new ActionRowBuilder();

  for (let i = 1; i <= 5; i++) {

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_rate_${i}`)
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

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.warning)
        .setTitle("⭐ Valora tu ticket")
        .setDescription(
          "Antes de cerrar definitivamente el ticket, selecciona una valoración del 1 al 5."
        )
        .setFooter({
          text: "LRM Studio • Fluent Glass"
        })
    ],
    components: [row]
  });
}


/* =========================================================
   CONFIG
   ========================================================= */

async function configureChannel(
  interaction,
  key,
  channel,
  data,
  saveData,
  name
) {

  const settings = getGuildSettings(
    data,
    interaction.guild.id
  );

  settings[key] = channel.id;

  saveData();

  return interaction.reply({
    embeds: [
      successEmbed(
        `${name} configurado en ${channel}.`
      )
    ],
    ephemeral: true
  });
}


/* =========================================================
   PREFIX COMMANDS
   ========================================================= */

const PREFIX_COMMANDS = new Set([
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

  client.on("messageCreate", async message => {

    if (!message.guild) return;
    if (message.author.bot) return;

    const hp =
      data.honeypot?.guilds?.[message.guild.id];

    if (
      hp &&
      hp.channelId === message.channel.id
    ) {

      if (
        message.author.id === message.guild.ownerId ||
        message.member.permissions.has(
          PermissionFlagsBits.Administrator
        )
      ) {
        return;
      }

      if (
        message.member.roles.cache.has(
          STAFF_ROLE_ID
        )
      ) {
        return;
      }

      if (
        !message.guild.members.me?.permissions.has(
          PermissionFlagsBits.BanMembers
        )
      ) {
        return;
      }

      if (
        !message.guild.members.me.roles.highest ||
        message.member.roles.highest.position >=
          message.guild.members.me.roles.highest.position
      ) {
        return;
      }

      await message.guild.members.ban(
        message.author.id,
        {
          reason: "LRM Studio Honeypot"
        }
      ).catch(() => null);

      hp.bans = Number(hp.bans || 0) + 1;

      await message.delete().catch(() => {});

      saveData();

      await updateHoneypotMessage(
        message.guild,
        hp
      );

      return;
    }

    if (!message.content.startsWith(prefix)) return;

    const args = getArgs(
      message.content.slice(prefix.length).trim()
    );

    if (!args.length) return;

    const command = args.shift().toLowerCase();

    if (!PREFIX_COMMANDS.has(command)) return;

    /* ===================================================
       HELP
       =================================================== */

    if (command === "help") {

      return message.reply({
        embeds: [helpEmbed()],
        components: [helpMenu()]
      });
    }

    /* ===================================================
       ADMIN
       =================================================== */

    if (command === "admin") {

      if (!discordAdmin(message.member)) {

        return message.reply({
          embeds: [
            errorEmbed(
              "Necesitas permisos de **Administrador** para usar este panel."
            )
          ]
        });
      }

      return message.reply({
        embeds: [adminEmbed()],
        components: [adminMenu()]
      });
    }

    /* ===================================================
       PERMISSION CHECK FOR EVERYTHING BELOW
       =================================================== */

    if (
      [
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
      ].includes(command)
    ) {

      if (
        !discordAdmin(message.member) &&
        !hasStaffPermission(
          data,
          message.member,
          command === "ticketpanel"
            ? "gestionar_tickets"
            : command
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

    /* ===================================================
       PANEL
       =================================================== */

    if (command === "panel") {

      if (!args[0] || !args[1]) {

        return message.reply({
          embeds: [
            errorEmbed(
              `Uso: \`${prefix}panel nombre "mensaje" "preguntas" emoji "mensaje ingreso"\``
            )
          ]
        });
      }

      const name = args.shift();
      const panelMessage = args.shift();

      const questionsText = args.shift() || "";

      const emoji = args.shift() || "🎫";

      const welcomeMessage =
        args.shift() ||
        "Gracias por abrir un ticket. Un miembro del equipo te atenderá pronto.";

      const extraQuestions = args.filter(Boolean);

      const questions = [];

      if (questionsText) {
        questions.push(
          ...questionsText
            .split("|")
            .map(x => x.trim())
            .filter(Boolean)
        );
      }

      questions.push(...extraQuestions);

      const key = panelKey(name);

      data.ticketSystem.panels[key] = {
        key,
        name,
        message: panelMessage,
        questions,
        emoji: parseMenuEmoji(emoji),
        welcomeMessage
      };

      saveData();

      return message.reply({
        embeds: [
          successEmbed(
            `Panel **${name}** creado correctamente.\n\nClave: \`${key}\``
          )
        ]
      });
    }

    /* ===================================================
       TICKET PANEL
       =================================================== */

    if (command === "ticketpanel") {

      const channel = parseChannel(
        message,
        args[0]
      );

      const key = args[1];

      const panel =
        data.ticketSystem.panels[key];

      if (!channel || !panel) {

        return message.reply({
          embeds: [
            errorEmbed(
              "Canal o panel no válido."
            )
          ]
        });
      }

      const button = new ButtonBuilder()
        .setCustomId(`ticket_open_${panel.key}`)
        .setLabel("Abrir ticket")
        .setEmoji(panel.emoji || "🎫")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder()
        .addComponents(button);

      const embed = new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle(`🎫 ${panel.name}`)
        .setDescription(panel.message)
        .setFooter({
          text: "LRM Studio • Fluent Glass"
        });

      await channel.send({
        embeds: [embed],
        components: [row]
      });

      return message.reply({
        embeds: [
          successEmbed(
            `Panel publicado en ${channel}.`
          )
        ]
      });
    }

    /* ===================================================
       STAFF
       =================================================== */

    if (command === "staff") {

      const role = parseRole(
        message,
        args[0]
      );

      const permission = args[1];

      const action = args[2] || "add";

      if (!role || !permission) {

        return message.reply({
          embeds: [
            errorEmbed(
              `Uso: \`${prefix}staff @rol permiso add/remove\``
            )
          ]
        });
      }

      data.ticketSystem.staffRoles[message.guild.id] ??= {};
      data.ticketSystem.staffRoles[message.guild.id][role.id] ??= {};

      if (action === "remove") {

        delete data.ticketSystem.staffRoles[
          message.guild.id
        ][role.id][permission];

      } else {

        data.ticketSystem.staffRoles[
          message.guild.id
        ][role.id][permission] = true;
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

    /* ===================================================
       MODERATION
       =================================================== */

    if (command === "ban") {

      const member =
        getMentionedMember(message, args[0]) ||
        await message.guild.members
          .fetch(args[0])
          .catch(() => null);

      if (!member) {
        return message.reply({
          embeds: [
            errorEmbed("No encontré a ese usuario.")
          ]
        });
      }

      const reason =
        args.slice(1).join(" ") ||
        "Sin razón especificada";

      const problem =
        await moderateTarget(
          message,
          member
        );

      if (problem) {
        return message.reply({
          embeds: [errorEmbed(problem)]
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

      await member.ban({ reason });

      return message.reply({
        embeds: [
          successEmbed(
            `${member.user.tag} fue baneado.\n**Razón:** ${reason}`
          )
        ]
      });
    }

    if (command === "kick") {

      const member =
        getMentionedMember(message, args[0]) ||
        await message.guild.members
          .fetch(args[0])
          .catch(() => null);

      if (!member) {
        return message.reply({
          embeds: [
            errorEmbed("No encontré a ese usuario.")
          ]
        });
      }

      const reason =
        args.slice(1).join(" ") ||
        "Sin razón especificada";

      const problem =
        await moderateTarget(
          message,
          member
        );

      if (problem) {
        return message.reply({
          embeds: [errorEmbed(problem)]
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

      await member.kick(reason);

      return message.reply({
        embeds: [
          successEmbed(
            `${member.user.tag} fue expulsado.\n**Razón:** ${reason}`
          )
        ]
      });
    }

    if (command === "mute") {

      const member =
        getMentionedMember(message, args[0]) ||
        await message.guild.members
          .fetch(args[0])
          .catch(() => null);

      const minutes = Number(args[1]);

      if (!member || !Number.isInteger(minutes)) {

        return message.reply({
          embeds: [
            errorEmbed(
              `Uso: \`${prefix}mute @usuario minutos razón\``
            )
          ]
        });
      }

      const problem =
        await moderateTarget(
          message,
          member
        );

      if (problem) {
        return message.reply({
          embeds: [errorEmbed(problem)]
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
        args.slice(2).join(" ") ||
        "Sin razón especificada";

      await member.timeout(
        minutes * 60 * 1000,
        reason
      );

      return message.reply({
        embeds: [
          successEmbed(
            `${member.user.tag} fue silenciado durante **${minutes} minutos**.\n**Razón:** ${reason}`
          )
        ]
      });
    }

    if (command === "unmute") {

      const member =
        getMentionedMember(message, args[0]) ||
        await message.guild.members
          .fetch(args[0])
          .catch(() => null);

      if (!member) {
        return message.reply({
          embeds: [
            errorEmbed("No encontré a ese usuario.")
          ]
        });
      }

      const problem =
        await moderateTarget(
          message,
          member
        );

      if (problem) {
        return message.reply({
          embeds: [errorEmbed(problem)]
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
        args.slice(1).join(" ") ||
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

    if (command === "unban") {

      const userId = args[0];

      if (!/^\d{17,20}$/.test(userId || "")) {

        return message.reply({
          embeds: [
            errorEmbed(
              "Debes proporcionar una ID de usuario válida."
            )
          ]
        });
      }

      await message.guild.members.unban(
        userId,
        args.slice(1).join(" ") ||
        "Desbaneado por staff"
      );

      return message.reply({
        embeds: [
          successEmbed(
            `Usuario \`${userId}\` desbaneado.`
          )
        ]
      });
    }

    if (command === "purge") {

      const amount = Number(args[0]);

      if (
        !Number.isInteger(amount) ||
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
        await message.channel.bulkDelete(
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

      setTimeout(() => {
        response.delete().catch(() => {});
      }, 3000);

      return;
    }

    if (command === "warn") {

      const member =
        getMentionedMember(message, args[0]) ||
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

      const reason =
        args.slice(1).join(" ") ||
        "Sin razón especificada";

      const warnings =
        ensureWarnings(
          data,
          message.guild.id,
          member.id
        );

      warnings.push({
        reason,
        moderatorId: message.author.id,
        timestamp: Date.now()
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

    if (command === "warnings") {

      const member =
        getMentionedMember(message, args[0]) ||
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

      const text = warnings
        .slice(-10)
        .map((w, i) =>
          `**${i + 1}.** ${w.reason}\n` +
          `> <@${w.moderatorId}> • <t:${Math.floor(w.timestamp / 1000)}:R>`
        )
        .join("\n\n");

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

    if (command === "clearwarns") {

      const member =
        getMentionedMember(message, args[0]) ||
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

      data.moderation.warnings[
        message.guild.id
      ] ??= {};

      data.moderation.warnings[
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

    /* ===================================================
       CONFIGURACIÓN
       =================================================== */

    const configCommands = {
      bienvenidaset: ["welcomeChannel", "bienvenidas"],
      inviteset: ["inviteChannel", "invitaciones"],
      niveleset: ["levelChannel", "niveles"],
      alianzaset: ["allianceChannel", "alianzas"],
      affysset: ["affysChannel", "affys"],
      surgeset: ["suggestionChannel", "sugerencias"]
    };

    if (configCommands[command]) {

      const [key, name] =
        configCommands[command];

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

      const settings =
        getGuildSettings(
          data,
          message.guild.id
        );

      settings[key] = channel.id;

      saveData();

      return message.reply({
        embeds: [
          successEmbed(
            `Canal de **${name}** configurado en ${channel}.`
          )
        ]
      });
    }

    if (command === "honeypotset") {

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

    if (command === "valoraciones") {

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

      data.ticketSystem.logs.valoraciones =
        channel.id;

      saveData();

      return message.reply({
        embeds: [
          successEmbed(
            `Canal de valoraciones: ${channel}`
          )
        ]
      });
    }

    if (command === "transaccion") {

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

      data.ticketSystem.logs.transacciones =
        channel.id;

      saveData();

      return message.reply({
        embeds: [
          successEmbed(
            `Canal de transacciones: ${channel}`
          )
        ]
      });
    }

    if (command === "ticketlogs") {

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

      data.ticketSystem.logs.tickets =
        channel.id;

      saveData();

      return message.reply({
        embeds: [
          successEmbed(
            `Logs de tickets: ${channel}`
          )
        ]
      });
    }
  });


  /* =====================================================
     INTERACTIONS
     ===================================================== */

  client.on("interactionCreate", async interaction => {

    try {

      /* =================================================
         HELP SELECT
         ================================================= */

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "lrm_help_menu"
      ) {

        const category = interaction.values[0];

        return interaction.update({
          embeds: [
            helpEmbed(category)
          ],
          components: [
            helpMenu()
          ]
        });
      }


      /* =================================================
         ADMIN SELECT
         ================================================= */

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "lrm_admin_menu"
      ) {

        if (
          !discordAdmin(interaction.member)
        ) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Necesitas permisos de Administrador."
              )
            ],
            ephemeral: true
          });
        }

        const category =
          interaction.values[0];

        return interaction.update({
          embeds: [
            adminEmbed(category)
          ],
          components: [
            adminMenu()
          ]
        });
      }


      /* =================================================
         TICKET OPEN
         ================================================= */

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
          data.ticketSystem.panels[key];

        if (!panel) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Este panel ya no existe."
              )
            ],
            ephemeral: true
          });
        }

        return createTicket({
          interaction,
          panel,
          data,
          saveData
        });
      }


      /* =================================================
         TICKET CLAIM
         ================================================= */

      if (
        interaction.isButton() &&
        interaction.customId === "ticket_claim"
      ) {

        const ticket =
          data.ticketSystem.openTickets?.[
            interaction.guild.id
          ]?.[interaction.channel.id];

        if (!ticket) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Este canal no es un ticket."
              )
            ],
            ephemeral: true
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
            ephemeral: true
          });
        }

        if (ticket.claimedBy) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                `Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`
              )
            ],
            ephemeral: true
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


      /* =================================================
         TICKET CLOSE
         ================================================= */

      if (
        interaction.isButton() &&
        interaction.customId === "ticket_close"
      ) {

        return requestTicketClose(
          interaction,
          data,
          saveData
        );
      }


      /* =================================================
         TICKET RATING
         ================================================= */

      if (
        interaction.isButton() &&
        interaction.customId.startsWith(
          "ticket_rate_"
        )
      ) {

        const rating =
          Number(
            interaction.customId
              .replace("ticket_rate_", "")
          );

        const ticket =
          data.ticketSystem.openTickets?.[
            interaction.guild.id
          ]?.[interaction.channel.id];

        if (!ticket) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "El ticket ya no existe."
              )
            ],
            ephemeral: true
          });
        }

        const logChannelId =
          data.ticketSystem.logs.valoraciones;

        if (logChannelId) {

          const logChannel =
            interaction.guild.channels.cache.get(
              logChannelId
            );

          if (logChannel) {

            const embed =
              new EmbedBuilder()
                .setColor(COLORS.warning)
                .setTitle("⭐ Nueva valoración")
                .addFields(
                  {
                    name: "Usuario",
                    value: `${interaction.user}`,
                    inline: true
                  },
                  {
                    name: "Valoración",
                    value: `${rating}/5`,
                    inline: true
                  },
                  {
                    name: "Ticket",
                    value: `<#${interaction.channel.id}>`,
                    inline: true
                  }
                )
                .setFooter({
                  text: "LRM Studio • Fluent Glass"
                });

            await logChannel.send({
              embeds: [embed]
            }).catch(() => {});
          }
        }

        delete data.ticketSystem.openTickets[
          interaction.guild.id
        ][interaction.channel.id];

        saveData();

        await interaction.update({
          embeds: [
            successEmbed(
              `Gracias por tu valoración: **${rating}/5** ⭐\nEste ticket se cerrará en unos segundos.`
            )
          ],
          components: []
        });

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 5000);

        return;
      }


      /* =================================================
         SLASH COMMANDS
         ================================================= */

      if (!interaction.isChatInputCommand()) return;

      const command =
        interaction.commandName;

      /* ADMIN */

      if (command === "admin") {

        if (
          !discordAdmin(interaction.member)
        ) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Necesitas permisos de Administrador."
              )
            ],
            ephemeral: true
          });
        }

        return interaction.reply({
          embeds: [adminEmbed()],
          components: [adminMenu()]
        });
      }


      /* PANEL */

      if (command === "panel") {

        if (
          !discordAdmin(interaction.member)
        ) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Necesitas permisos de Administrador."
              )
            ],
            ephemeral: true
          });
        }

        const name =
          interaction.options.getString("nombre");

        const panelMessage =
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

        const welcomeMessage =
          interaction.options.getString(
            "mensaje_ingreso"
          );

        const questions = questionsText
          ? questionsText
              .split("|")
              .map(x => x.trim())
              .filter(Boolean)
          : [];

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

        const key = panelKey(name);

        data.ticketSystem.panels[key] = {
          key,
          name,
          message: panelMessage,
          questions,
          emoji: parseMenuEmoji(emoji),
          welcomeMessage
        };

        saveData();

        return interaction.reply({
          embeds: [
            successEmbed(
              `Panel **${name}** creado.\nClave: \`${key}\``
            )
          ],
          ephemeral: true
        });
      }


      /* TICKET PANEL */

      if (command === "ticketpanel") {

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
            ephemeral: true
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
          data.ticketSystem.panels[key];

        if (!panel) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Ese panel no existe."
              )
            ],
            ephemeral: true
          });
        }

        const button =
          new ButtonBuilder()
            .setCustomId(
              `ticket_open_${panel.key}`
            )
            .setLabel("Abrir ticket")
            .setEmoji(
              panel.emoji || "🎫"
            )
            .setStyle(
              ButtonStyle.Primary
            );

        const row =
          new ActionRowBuilder()
            .addComponents(button);

        const embed =
          new EmbedBuilder()
            .setColor(COLORS.primary)
            .setTitle(
              `🎫 ${panel.name}`
            )
            .setDescription(
              panel.message
            )
            .setFooter({
              text:
                "LRM Studio • Fluent Glass"
            });

        await channel.send({
          embeds: [embed],
          components: [row]
        });

        return interaction.reply({
          embeds: [
            successEmbed(
              `Panel publicado en ${channel}.`
            )
          ],
          ephemeral: true
        });
      }


      /* STAFF */

      if (command === "staff") {

        if (
          !discordAdmin(interaction.member)
        ) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Necesitas permisos de Administrador."
              )
            ],
            ephemeral: true
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

        data.ticketSystem.staffRoles[
          interaction.guild.id
        ] ??= {};

        data.ticketSystem.staffRoles[
          interaction.guild.id
        ][role.id] ??= {};

        if (action === "remove") {

          delete data.ticketSystem.staffRoles[
            interaction.guild.id
          ][role.id][permission];

        } else {

          data.ticketSystem.staffRoles[
            interaction.guild.id
          ][role.id][permission] = true;
        }

        saveData();

        return interaction.reply({
          embeds: [
            successEmbed(
              `${role} → \`${permission}\` → **${action}**`
            )
          ],
          ephemeral: true
        });
      }


      /* LOG CONFIG */

      const logCommands = {
        valoraciones: "valoraciones",
        transaccion: "transacciones",
        ticketlogs: "tickets"
      };

      if (logCommands[command]) {

        if (
          !discordAdmin(interaction.member)
        ) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Necesitas permisos de Administrador."
              )
            ],
            ephemeral: true
          });
        }

        const channel =
          interaction.options.getChannel(
            "canal"
          );

        data.ticketSystem.logs[
          logCommands[command]
        ] = channel.id;

        saveData();

        return interaction.reply({
          embeds: [
            successEmbed(
              `Configurado en ${channel}.`
            )
          ],
          ephemeral: true
        });
      }


      /* =================================================
         MODERATION SLASH
         ================================================= */

      if (
        [
          "ban",
          "kick",
          "mute",
          "unmute",
          "unban",
          "purge",
          "warn",
          "warnings",
          "clearwarns"
        ].includes(command)
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
            ephemeral: true
          });
        }
      }


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
            await moderateTarget(
              {
                guild: interaction.guild,
                author: interaction.user,
                member: interaction.member
              },
              member
            );

          if (problem) {

            return interaction.reply({
              embeds: [errorEmbed(problem)],
              ephemeral: true
            });
          }

          if (!member.bannable) {

            return interaction.reply({
              embeds: [
                errorEmbed(
                  "No puedo banear a ese usuario."
                )
              ],
              ephemeral: true
            });
          }
        }

        const reason =
          interaction.options.getString(
            "razon"
          ) || "Sin razón especificada";

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
            ephemeral: true
          });
        }

        const problem =
          await moderateTarget(
            {
              guild: interaction.guild,
              author: interaction.user,
              member: interaction.member
            },
            member
          );

        if (problem) {

          return interaction.reply({
            embeds: [errorEmbed(problem)],
            ephemeral: true
          });
        }

        if (!member.kickable) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "No puedo expulsar a ese usuario."
              )
            ],
            ephemeral: true
          });
        }

        const reason =
          interaction.options.getString(
            "razon"
          ) || "Sin razón especificada";

        await member.kick(reason);

        return interaction.reply({
          embeds: [
            successEmbed(
              `${user.tag} fue expulsado.\n**Razón:** ${reason}`
            )
          ]
        });
      }


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
            ephemeral: true
          });
        }

        const problem =
          await moderateTarget(
            {
              guild: interaction.guild,
              author: interaction.user,
              member: interaction.member
            },
            member
          );

        if (problem) {

          return interaction.reply({
            embeds: [errorEmbed(problem)],
            ephemeral: true
          });
        }

        if (!member.moderatable) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "No puedo modificar el timeout de ese usuario."
              )
            ],
            ephemeral: true
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
            ) || "Sin razón especificada";

          await member.timeout(
            minutes * 60 * 1000,
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
          ) || "Timeout eliminado";

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


      if (command === "unban") {

        const id =
          interaction.options.getString(
            "usuario_id"
          );

        const reason =
          interaction.options.getString(
            "razon"
          ) || "Desbaneado por staff";

        await interaction.guild.members.unban(
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


      if (command === "purge") {

        const amount =
          interaction.options.getInteger(
            "cantidad"
          );

        const deleted =
          await interaction.channel.bulkDelete(
            amount,
            true
          );

        return interaction.reply({
          embeds: [
            successEmbed(
              `Se eliminaron **${deleted.size}** mensajes.`
            )
          ],
          ephemeral: true
        });
      }


      if (command === "warn") {

        const user =
          interaction.options.getUser(
            "usuario"
          );

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
          moderatorId: interaction.user.id,
          timestamp: Date.now()
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


      if (command === "warnings") {

        const user =
          interaction.options.getUser(
            "usuario"
          ) || interaction.user;

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
            .map((w, i) =>
              `**${i + 1}.** ${w.reason}\n` +
              `> <@${w.moderatorId}> • <t:${Math.floor(w.timestamp / 1000)}:R>`
            )
            .join("\n\n");

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


      if (command === "clearwarns") {

        const user =
          interaction.options.getUser(
            "usuario"
          );

        data.moderation.warnings[
          interaction.guild.id
        ] ??= {};

        data.moderation.warnings[
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


      /* =================================================
         CONFIG SLASH
         ================================================= */

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

      if (configSlash[command]) {

        if (
          !discordAdmin(interaction.member)
        ) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Necesitas permisos de Administrador."
              )
            ],
            ephemeral: true
          });
        }

        const [
          key,
          name
        ] = configSlash[command];

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
          ephemeral: true
        });
      }


      /* =================================================
         HONEYPOT SLASH
         ================================================= */

      if (command === "honeypotset") {

        if (
          !discordAdmin(interaction.member)
        ) {

          return interaction.reply({
            embeds: [
              errorEmbed(
                "Necesitas permisos de Administrador."
              )
            ],
            ephemeral: true
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
          ephemeral: true
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
          ephemeral: true
        }).catch(() => {});
      }
    }
  });


  /* =====================================================
     HONEYPOT / STARTUP
     ===================================================== */

  client.once("ready", async () => {

    ensureData(data);

    for (const guild of client.guilds.cache.values()) {

      const config =
        data.honeypot?.guilds?.[guild.id];

      if (!config) continue;

      await updateHoneypotMessage(
        guild,
        config
      );
    }
  });

  console.log(
    "[LRM Studio] Sistema administrativo cargado."
  );
}


/* =========================================================
   EXPORTS
   ========================================================= */

module.exports = {
  setupAdmin,
  adminCommands
};

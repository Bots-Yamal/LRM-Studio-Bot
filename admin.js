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

const TICKET_STAFF_ROLE =
  "1565609209444175893";

const HONEYPOT_MESSAGE = `🍯・Honeypot

Este canal forma parte del sistema de seguridad de LRM Studio.

⚠️ No interactúes con este canal.

Cualquier interacción será detectada automáticamente y podrá activar las medidas de seguridad del servidor.

🛡️ LRM Studio Security`;

let bot;
let DATA;
let save;
let sendLog;
let logAction;
let getUser;
let PREFIX;
let COLORS;
let E;

// =====================================================
// UTILIDADES
// =====================================================

function glassEmbed(color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({
      text: "LRM Studio  •  Fluent Glass"
    });
}

function errorEmbed(text) {
  return glassEmbed(COLORS.error)
    .setTitle(`${E.error}  Error`)
    .setDescription(text);
}

function successEmbed(text) {
  return glassEmbed(COLORS.success)
    .setTitle(`${E.success}  Completado`)
    .setDescription(text);
}

function parseMenuEmoji(value) {
  if (!value) return null;

  const match = value.match(
    /<a?:\w+:(\d+)>/
  );

  if (match) {
    return value;
  }

  return value;
}

function panelKey(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function replaceVariables(text, variables = {}) {
  let result = String(text || "");

  for (const [key, value] of Object.entries(
    variables
  )) {
    result = result.replaceAll(
      key,
      String(value ?? "")
    );
  }

  return result;
}

// =====================================================
// PERMISOS
// =====================================================

function discordAdmin(member) {
  return Boolean(
    member?.permissions?.has(
      PermissionFlagsBits.Administrator
    )
  );
}

function getMemberPermissions(member) {
  const permissions = new Set();

  if (!member) return permissions;

  if (discordAdmin(member)) {
    permissions.add("admin");
    permissions.add("ver_ticket");
    permissions.add("cerrar_ticket");
    permissions.add("reclamar_ticket");
    permissions.add("gestionar_tickets");
    permissions.add("ban");
    permissions.add("unban");
    permissions.add("mute");
    permissions.add("unmute");
    permissions.add("kick");
    permissions.add("warn");
    permissions.add("warnings");
    permissions.add("clearwarns");
    permissions.add("purge");
  }

  const roles =
    DATA.ticketSystem.staffRoles ||
    {};

  for (const roleData of Object.values(
    roles
  )) {
    const role =
      member.guild.roles.cache.get(
        roleData.roleId
      );

    if (!role) continue;

    if (!member.roles.cache.has(role.id)) {
      continue;
    }

    for (const permission of Object.keys(
      roleData.permissions || {}
    )) {
      if (
        roleData.permissions[permission]
      ) {
        permissions.add(permission);
      }
    }
  }

  return permissions;
}

function hasStaffPermission(
  member,
  permission
) {
  if (discordAdmin(member)) {
    return true;
  }

  return getMemberPermissions(
    member
  ).has(permission);
}

function canManageSystem(member) {
  return (
    discordAdmin(member) ||
    hasStaffPermission(member, "admin")
  );
}

function getTicketViewerRoles(guild) {
  const result = [];

  for (const roleData of Object.values(
    DATA.ticketSystem.staffRoles || {}
  )) {
    if (
      roleData.permissions?.ver_ticket ||
      roleData.permissions?.gestionar_tickets
    ) {
      const role =
        guild.roles.cache.get(
          roleData.roleId
        );

      if (role) {
        result.push(role);
      }
    }
  }

  const exactRole =
    guild.roles.cache.get(
      TICKET_STAFF_ROLE
    );

  if (
    exactRole &&
    !result.some(
      role => role.id === exactRole.id
    )
  ) {
    result.push(exactRole);
  }

  return result;
}

// =====================================================
// TICKET DATA
// =====================================================

function ensureTicketData() {
  DATA.ticketSystem ??= {};
  DATA.ticketSystem.panels ??= {};
  DATA.ticketSystem.staffRoles ??= {};
  DATA.ticketSystem.openTickets ??= {};
  DATA.ticketSystem.logs ??= {};

  DATA.ticketSystem.logs.valoraciones ??=
    null;

  DATA.ticketSystem.logs.transacciones ??=
    null;

  DATA.ticketSystem.logs.tickets ??=
    null;
}

// =====================================================
// GUILD SETTINGS
// =====================================================

function ensureSystemChannels() {
  DATA.settings ??= {};
  DATA.settings.systemChannels ??= {};

  for (const key of [
    "bienvenida",
    "invites",
    "niveles",
    "alianzas",
    "affys",
    "sugerencias",
    "honeypot"
  ]) {
    DATA.settings.systemChannels[key] ??=
      null;
  }
}

// =====================================================
// LOG DE TICKETS
// =====================================================

async function ticketLog(
  guild,
  title,
  description,
  color = COLORS.info
) {
  const channelId =
    DATA.ticketSystem.logs.tickets;

  if (!channelId) return;

  const channel =
    guild.channels.cache.get(
      channelId
    );

  if (!channel?.isTextBased()) return;

  await channel.send({
    embeds: [
      glassEmbed(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp()
    ]
  }).catch(() => {});
}

async function ratingLog(
  guild,
  ticket,
  user,
  rating
) {
  const channelId =
    DATA.ticketSystem.logs.valoraciones;

  if (!channelId) return;

  const channel =
    guild.channels.cache.get(
      channelId
    );

  if (!channel?.isTextBased()) return;

  await channel.send({
    embeds: [
      glassEmbed(COLORS.warning)
        .setTitle("⭐・Nueva valoración")
        .setDescription(
          `**Ticket:** ${ticket.name}\n` +
          `**Usuario:** ${user}\n` +
          `**Valoración:** ${rating}/5`
        )
        .setTimestamp()
    ]
  }).catch(() => {});
}

// =====================================================
// SINCRONIZAR PERMISOS DEL TICKET
// =====================================================

async function syncRoleTicketPermissions(
  channel
) {
  const roles =
    getTicketViewerRoles(
      channel.guild
    );

  for (const role of roles) {
    await channel.permissionOverwrites
      .edit(role.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      })
      .catch(() => {});
  }
}

// =====================================================
// CREAR TICKET
// =====================================================

async function createTicket(
  interaction,
  panel
) {
  ensureTicketData();

  const guild =
    interaction.guild;

  const user =
    interaction.user;

  const key =
    panelKey(panel.name);

  DATA.ticketSystem.openTickets[
    guild.id
  ] ??= {};

  const existing =
    DATA.ticketSystem.openTickets[
      guild.id
    ];

  const duplicate =
    Object.values(existing).find(
      ticket =>
        ticket.userId === user.id &&
        ticket.panelKey === key
    );

  if (duplicate) {
    const existingChannel =
      guild.channels.cache.get(
        duplicate.channelId
      );

    return interaction.reply({
      embeds: [
        errorEmbed(
          existingChannel
            ? `Ya tienes un ticket abierto: ${existingChannel}`
            : "Ya tienes un ticket abierto de este tipo."
        )
      ],
      ephemeral: true
    });
  }

  const safeName =
    user.username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 18) ||
    "usuario";

  const channel =
    await guild.channels.create({
      name: `ticket-${safeName}`,
      type: ChannelType.GuildText,
      parent:
        panel.categoryId || null,
      permissionOverwrites: [
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
            PermissionFlagsBits.AttachFiles
          ]
        }
      ]
    }).catch(() => null);

  if (!channel) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "No pude crear el ticket. Revisa los permisos del bot."
        )
      ],
      ephemeral: true
    });
  }

  await syncRoleTicketPermissions(
    channel
  );

  const questions =
    Array.isArray(panel.questions)
      ? panel.questions
          .filter(Boolean)
          .slice(0, 2)
      : [];

  const embed =
    glassEmbed(COLORS.primary)
      .setTitle(
        panel.panelName ||
        panel.name
      )
      .setDescription(
        `${panel.message || "Gracias por contactar con LRM Studio."}\n\n` +
        `👤 Usuario: ${user}\n` +
        `📁 Categoría: **${panel.name}**`
      );

  if (questions.length) {
    embed.addFields({
      name: "📋 Preguntas",
      value: questions
        .map(
          (question, index) =>
            `**${index + 1}.** ${question}`
        )
        .join("\n")
    });
  }

  const buttons =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `ticket_claim:${channel.id}`
          )
          .setLabel("Reclamar")
          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()
          .setCustomId(
            `ticket_close:${channel.id}`
          )
          .setLabel("Cerrar")
          .setStyle(
            ButtonStyle.Danger
          )
      );

  // PING EXACTO FUERA DEL EMBED
  await channel.send({
    content:
      `${user} <@&${TICKET_STAFF_ROLE}>`,
    embeds: [embed],
    components: [buttons]
  });

  DATA.ticketSystem.openTickets[
    guild.id
  ][channel.id] = {
    channelId: channel.id,
    userId: user.id,
    panelKey: key,
    panelName:
      panel.name,
    claimedBy: null,
    createdAt: Date.now()
  };

  save();

  await ticketLog(
    guild,
    "🎫・Ticket creado",
    `**Usuario:** ${user}\n` +
    `**Canal:** ${channel}\n` +
    `**Panel:** ${panel.name}`,
    COLORS.primary
  );

  return interaction.reply({
    embeds: [
      successEmbed(
        `Tu ticket fue creado: ${channel}`
      )
    ],
    ephemeral: true
  });
}

// =====================================================
// CERRAR TICKET
// =====================================================

async function requestTicketClose(
  interaction,
  channel
) {
  const ticket =
    DATA.ticketSystem
      .openTickets?.[
        interaction.guild.id
      ]?.[channel.id];

  if (!ticket) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Este canal no parece ser un ticket."
        )
      ],
      ephemeral: true
    });
  }

  const member =
    interaction.member;

  const isOwner =
    ticket.userId ===
    interaction.user.id;

  const canClose =
    isOwner ||
    hasStaffPermission(
      member,
      "cerrar_ticket"
    ) ||
    hasStaffPermission(
      member,
      "gestionar_tickets"
    );

  if (!canClose) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "No tienes permiso para cerrar este ticket."
        )
      ],
      ephemeral: true
    });
  }

  const modal =
    new ModalBuilder()
      .setCustomId(
        `ticket_rating:${channel.id}`
      )
      .setTitle(
        "⭐・Valorar ticket"
      );

  const ratingInput =
    new TextInputBuilder()
      .setCustomId("rating")
      .setLabel(
        "Valoración del 1 al 5"
      )
      .setPlaceholder(
        "Ejemplo: 5"
      )
      .setStyle(
        TextInputStyle.Short
      )
      .setMinLength(1)
      .setMaxLength(1)
      .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      ratingInput
    )
  );

  return interaction.showModal(
    modal
  );
}

// =====================================================
// ADMIN SELECT MENU
// =====================================================

function buildAdminMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(
          "lrm_admin_menu"
        )
        .setPlaceholder(
          "Selecciona una opción..."
        )
        .addOptions(
          {
            label: "Información",
            description:
              "Información administrativa",
            value: "info",
            emoji: "◉"
          },
          {
            label: "Tickets",
            description:
              "Gestionar tickets",
            value: "tickets",
            emoji: "🎫"
          },
          {
            label: "Logs",
            description:
              "Ver configuración de logs",
            value: "logs",
            emoji: "⌁"
          },
          {
            label: "Moderación",
            description:
              "Herramientas de moderación",
            value: "moderation",
            emoji: "🛡️"
          }
        )
    );
}

// =====================================================
// HONEYPOT
// =====================================================

async function updateHoneyPotButton(
  guild
) {
  const channelId =
    DATA.honeypot?.channelId;

  const messageId =
    DATA.honeypot?.messageId;

  if (!channelId || !messageId) {
    return;
  }

  const channel =
    guild.channels.cache.get(
      channelId
    );

  if (!channel?.isTextBased()) {
    return;
  }

  const message =
    await channel.messages
      .fetch(messageId)
      .catch(() => null);

  if (!message) return;

  const button =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            "honeypot_counter"
          )
          .setLabel(
            `Ban: ${DATA.honeypot.bans || 0}`
          )
          .setStyle(
            ButtonStyle.Danger
          )
          .setDisabled(true)
      );

  await message.edit({
    components: [button]
  }).catch(() => {});
}

async function setupHoneyPot(
  interaction,
  channel
) {
  DATA.honeypot ??= {};

  const oldChannel =
    DATA.honeypot.channelId;

  if (
    oldChannel &&
    oldChannel !== channel.id
  ) {
    DATA.settings.systemChannels.honeypot =
      null;
  }

  const button =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            "honeypot_counter"
          )
          .setLabel(
            `Ban: ${DATA.honeypot.bans || 0}`
          )
          .setStyle(
            ButtonStyle.Danger
          )
          .setDisabled(true)
      );

  const message =
    await channel.send({
      embeds: [
        glassEmbed(COLORS.warning)
          .setDescription(
            HONEYPOT_MESSAGE
          )
      ],
      components: [button]
    }).catch(() => null);

  if (!message) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "No pude enviar el mensaje del HoneyPot."
        )
      ],
      ephemeral: true
    });
  }

  DATA.honeypot.channelId =
    channel.id;

  DATA.honeypot.messageId =
    message.id;

  DATA.honeypot.message =
    HONEYPOT_MESSAGE;

  DATA.settings.systemChannels.honeypot =
    channel.id;

  save();

  return interaction.reply({
    embeds: [
      successEmbed(
        `HoneyPot configurado en ${channel}.`
      )
    ],
    ephemeral: true
  });
}

async function handleHoneyPot(
  message
) {
  if (
    !message.guild ||
    message.author.bot
  ) {
    return false;
  }

  const channelId =
    DATA.honeypot?.channelId;

  if (
    !channelId ||
    message.channel.id !== channelId
  ) {
    return false;
  }

  const member =
    message.member;

  if (!member) {
    return true;
  }

  // Dueño protegido
  if (
    message.guild.ownerId ===
    member.id
  ) {
    return true;
  }

  // Administradores protegidos
  if (
    discordAdmin(member)
  ) {
    return true;
  }

  // Admin interno protegido
  if (
    hasStaffPermission(
      member,
      "admin"
    )
  ) {
    return true;
  }

  // Nunca banear al bot
  if (
    message.author.id ===
    bot.user?.id
  ) {
    return true;
  }

  try {
    await message.delete()
      .catch(() => {});

    if (!member.bannable) {
      await logAction(
        message.guild,
        "admin",
        {
          title:
            "🍯・HoneyPot bloqueado",
          description:
            `Intento detectado de ${member}, pero no puedo banearlo por jerarquía/permisos.`,
          color:
            COLORS.warning
        }
      );

      return true;
    }

    await member.ban({
      reason:
        "LRM Studio HoneyPot Security"
    });

    DATA.honeypot.bans =
      (DATA.honeypot.bans || 0) + 1;

    save();

    await updateHoneyPotButton(
      message.guild
    );

    await logAction(
      message.guild,
      "admin",
      {
        title:
          "🍯・HoneyPot Ban",
        description:
          `${member} fue baneado automáticamente por interactuar con el HoneyPot.`,
        color:
          COLORS.error
      }
    );
  } catch (error) {
    console.error(
      "HoneyPot error:",
      error
    );
  }

  return true;
}

// =====================================================
// WARNINGS
// =====================================================

function ensureWarnings(
  guildId,
  userId
) {
  DATA.moderation ??= {};
  DATA.moderation.warnings ??= {};

  DATA.moderation.warnings[
    guildId
  ] ??= {};

  DATA.moderation.warnings[
    guildId
  ][userId] ??= [];

  return DATA.moderation.warnings[
    guildId
  ][userId];
}

function warningList(
  guildId,
  userId
) {
  return ensureWarnings(
    guildId,
    userId
  );
}

// =====================================================
// MODERACIÓN
// =====================================================

async function executeBan(
  guild,
  member,
  moderator,
  reason
) {
  if (!member) {
    return "Usuario no encontrado.";
  }

  if (
    member.id ===
    moderator.id
  ) {
    return "No puedes banearte a ti mismo.";
  }

  if (
    member.id ===
    guild.ownerId
  ) {
    return "No puedes banear al dueño del servidor.";
  }

  if (
    !member.bannable
  ) {
    return "No puedo banear a ese usuario. Revisa la jerarquía de roles.";
  }

  try {
    await member.ban({
      reason:
        reason ||
        `Moderado por ${moderator.tag}`
    });

    await logAction(
      guild,
      "admin",
      {
        title:
          "🔨・Ban",
        description:
          `${member.user} fue baneado por ${moderator}.\n\n` +
          `**Razón:** ${reason || "Sin razón"}`,
        color:
          COLORS.error
      }
    );

    return null;
  } catch {
    return "No pude banear al usuario.";
  }
}

async function executeKick(
  guild,
  member,
  moderator,
  reason
) {
  if (!member) {
    return "Usuario no encontrado.";
  }

  if (
    member.id ===
    moderator.id
  ) {
    return "No puedes expulsarte a ti mismo.";
  }

  if (
    member.id ===
    guild.ownerId
  ) {
    return "No puedes expulsar al dueño.";
  }

  if (
    !member.kickable
  ) {
    return "No puedo expulsar a ese usuario. Revisa la jerarquía.";
  }

  try {
    await member.kick(
      reason ||
      `Moderado por ${moderator.tag}`
    );

    await logAction(
      guild,
      "admin",
      {
        title:
          "👢・Kick",
        description:
          `${member.user} fue expulsado por ${moderator}.\n\n` +
          `**Razón:** ${reason || "Sin razón"}`,
        color:
          COLORS.warning
      }
    );

    return null;
  } catch {
    return "No pude expulsar al usuario.";
  }
}

async function executeMute(
  guild,
  member,
  moderator,
  minutes,
  reason
) {
  if (!member) {
    return "Usuario no encontrado.";
  }

  if (
    member.id ===
    moderator.id
  ) {
    return "No puedes silenciarte a ti mismo.";
  }

  if (
    member.id ===
    guild.ownerId
  ) {
    return "No puedes silenciar al dueño.";
  }

  if (
    !member.moderatable
  ) {
    return "No puedo silenciar a ese usuario.";
  }

  const duration =
    Math.max(
      1,
      Math.min(
        Number(minutes) || 1,
        40320
      )
    );

  try {
    await member.timeout(
      duration * 60 * 1000,
      reason ||
        `Moderado por ${moderator.tag}`
    );

    await logAction(
      guild,
      "admin",
      {
        title:
          "🔇・Mute",
        description:
          `${member.user} fue silenciado por ${moderator}.\n\n` +
          `**Duración:** ${duration} minutos\n` +
          `**Razón:** ${reason || "Sin razón"}`,
        color:
          COLORS.warning
      }
    );

    return null;
  } catch {
    return "No pude silenciar al usuario.";
  }
}

// =====================================================
// SLASH COMMANDS ADMIN
// =====================================================

const adminCommands = [
  new SlashCommandBuilder()
    .setName("admin")
    .setDescription(
      "Abre el panel administrativo."
    ),

  new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription(
      "Añade dinero a un usuario."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription("Cantidad")
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription(
      "Quita dinero a un usuario."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription("Cantidad")
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription(
      "Crea/configura un panel de tickets."
    )
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
        .setDescription(
          "Preguntas separadas por |"
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("emoji")
        .setDescription("Emoji")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensaje_ingreso")
        .setDescription(
          "Mensaje al entrar"
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("pregunta1")
        .setDescription("Pregunta 1")
    )
    .addStringOption(o =>
      o.setName("pregunta2")
        .setDescription("Pregunta 2")
    ),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription(
      "Envía un panel de tickets."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("panel")
        .setDescription("Panel")
        .setAutocomplete(true)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("staff")
    .setDescription(
      "Configura permisos de staff."
    )
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
          {
            name: "Ver tickets",
            value: "ver_ticket"
          },
          {
            name: "Cerrar tickets",
            value: "cerrar_ticket"
          },
          {
            name: "Reclamar tickets",
            value: "reclamar_ticket"
          },
          {
            name: "Gestionar tickets",
            value: "gestionar_tickets"
          },
          {
            name: "Ban",
            value: "ban"
          },
          {
            name: "Unban",
            value: "unban"
          },
          {
            name: "Mute",
            value: "mute"
          },
          {
            name: "Unmute",
            value: "unmute"
          },
          {
            name: "Kick",
            value: "kick"
          },
          {
            name: "Warn",
            value: "warn"
          },
          {
            name: "Warnings",
            value: "warnings"
          },
          {
            name: "Clear warnings",
            value: "clearwarns"
          },
          {
            name: "Purge",
            value: "purge"
          },
          {
            name: "Admin",
            value: "admin"
          }
        )
    )
    .addStringOption(o =>
      o.setName("accion")
        .setDescription("Acción")
        .addChoices(
          {
            name: "Dar",
            value: "add"
          },
          {
            name: "Quitar",
            value: "remove"
          }
        )
    ),

  new SlashCommandBuilder()
    .setName("valoraciones")
    .setDescription(
      "Configura el canal de valoraciones."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("transaccion")
    .setDescription(
      "Configura el canal de transacciones."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticketlogs")
    .setDescription(
      "Configura el canal de logs de tickets."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un usuario.")
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
    .setDescription("Expulsa a un usuario.")
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
    .setDescription("Silencia a un usuario.")
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutos")
        .setDescription("Minutos")
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
      "Quita el silencio."
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
      "Desbanea mediante ID."
    )
    .addStringOption(o =>
      o.setName("usuario_id")
        .setDescription("ID del usuario")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon")
        .setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("purge")
    .setDescription(
      "Elimina mensajes."
    )
    .addIntegerOption(o =>
      o.setName("cantidad")
        .setDescription("Cantidad")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription(
      "Advierte a un usuario."
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
      "Muestra las advertencias."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
    ),

  new SlashCommandBuilder()
    .setName("clearwarns")
    .setDescription(
      "Elimina las advertencias."
    )
    .addUserOption(o =>
      o.setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("bienvenidaset")
    .setDescription(
      "Configura el canal de bienvenida."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("inviteset")
    .setDescription(
      "Configura el canal de invitaciones."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("niveleset")
    .setDescription(
      "Configura el canal de niveles."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("alianzaset")
    .setDescription(
      "Configura el canal de alianzas."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("affysset")
    .setDescription(
      "Configura el canal de Affys."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("honeypotset")
    .setDescription(
      "Configura el HoneyPot."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("surgeset")
    .setDescription(
      "Configura el canal de sugerencias."
    )
    .addChannelOption(o =>
      o.setName("canal")
        .setDescription("Canal")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription(
      "Envía un mensaje."
    )
    .addStringOption(o =>
      o.setName("mensaje")
        .setDescription("Mensaje")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("embed")
    .setDescription(
      "Envía un embed."
    )
    .addStringOption(o =>
      o.setName("color")
        .setDescription("Color hexadecimal")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensaje")
        .setDescription("Mensaje")
        .setRequired(true)
    )
];

// =====================================================
// EJECUCIÓN ADMIN SLASH
// =====================================================

async function handleAdminSlash(
  interaction
) {
  const command =
    interaction.commandName;

  const member =
    interaction.member;

  const adminCommandsList =
    adminCommands.map(
      command => command.name
    );

  if (
    !adminCommandsList.includes(
      command
    )
  ) {
    return false;
  }

  if (
    !canManageSystem(member) &&
    command !== "ban" &&
    command !== "kick" &&
    command !== "mute" &&
    command !== "unmute" &&
    command !== "unban" &&
    command !== "purge" &&
    command !== "warn" &&
    command !== "warnings" &&
    command !== "clearwarns"
  ) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "No tienes permisos administrativos."
        )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // ADMIN
  // -------------------------

  if (command === "admin") {
    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.admin)
          .setTitle(
            "⚙️・LRM Studio Admin"
          )
          .setDescription(
            "Selecciona una categoría para gestionar el bot."
          )
      ],
      components: [
        buildAdminMenu()
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // MONEY
  // -------------------------

  if (
    command === "addmoney" ||
    command === "removemoney"
  ) {
    const target =
      interaction.options.getUser(
        "usuario"
      );

    const amount =
      interaction.options.getInteger(
        "cantidad"
      );

    const account =
      getUser(target.id);

    if (
      command === "addmoney"
    ) {
      account.wallet += amount;
    } else {
      account.wallet =
        Math.max(
          0,
          account.wallet - amount
        );
    }

    save();

    await logAction(
      interaction.guild,
      "economia",
      {
        title:
          command === "addmoney"
            ? "💰・Dinero añadido"
            : "💸・Dinero retirado",
        description:
          `${interaction.user} modificó el balance de ${target}.\n` +
          `Cantidad: **$${amount.toLocaleString("es-ES")}**`,
        color:
          COLORS.economy
      }
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `${target} ahora tiene **$${account.wallet.toLocaleString("es-ES")}** en wallet.`
        )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // PANEL
  // -------------------------

  if (command === "panel") {
    const name =
      interaction.options.getString(
        "nombre"
      );

    const panelMessage =
      interaction.options.getString(
        "mensaje_panel"
      );

    const questionsRaw =
      interaction.options.getString(
        "preguntas"
      );

    const emoji =
      interaction.options.getString(
        "emoji"
      );

    const entryMessage =
      interaction.options.getString(
        "mensaje_ingreso"
      );

    const q1 =
      interaction.options.getString(
        "pregunta1"
      );

    const q2 =
      interaction.options.getString(
        "pregunta2"
      );

    const key =
      panelKey(name);

    const questions =
      [q1, q2]
        .filter(Boolean)
        .slice(0, 2);

    if (
      !questions.length &&
      questionsRaw
    ) {
      questions.push(
        ...questionsRaw
          .split("|")
          .map(
            value => value.trim()
          )
          .filter(Boolean)
          .slice(0, 2)
      );
    }

    DATA.ticketSystem.panels[
      key
    ] = {
      name,
      panelName: name,
      message: panelMessage,
      questions,
      emoji:
        parseMenuEmoji(emoji),
      entryMessage,
      categoryId: null
    };

    save();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Panel **${name}** guardado correctamente.`
        )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // TICKET PANEL
  // -------------------------

  if (
    command === "ticketpanel"
  ) {
    const channel =
      interaction.options.getChannel(
        "canal"
      );

    const name =
      interaction.options.getString(
        "panel"
      );

    const panel =
      DATA.ticketSystem.panels[
        panelKey(name)
      ];

    if (!panel) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No existe ese panel."
          )
        ],
        ephemeral: true
      });
    }

    const embed =
      glassEmbed(COLORS.primary)
        .setTitle(
          panel.panelName ||
          panel.name
        )
        .setDescription(
          panel.message
        );

    const menu =
      new StringSelectMenuBuilder()
        .setCustomId(
          `ticket_create:${panelKey(
            panel.name
          )}`
        )
        .setPlaceholder(
          "Selecciona una opción..."
        )
        .addOptions({
          label:
            panel.name,
          description:
            panel.entryMessage ||
            "Abrir ticket",
          value:
            panelKey(
              panel.name
            ),
          emoji:
            panel.emoji || undefined
        });

    await channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder()
          .addComponents(menu)
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

  // -------------------------
  // STAFF
  // -------------------------

  if (command === "staff") {
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

    DATA.ticketSystem.staffRoles[
      role.id
    ] ??= {
      roleId: role.id,
      permissions: {}
    };

    if (action === "remove") {
      delete DATA.ticketSystem
        .staffRoles[
          role.id
        ].permissions[
          permission
        ];
    } else {
      DATA.ticketSystem
        .staffRoles[
          role.id
        ].permissions[
          permission
        ] = true;
    }

    save();

    return interaction.reply({
      embeds: [
        successEmbed(
          action === "remove"
            ? `Se quitó **${permission}** a ${role}.`
            : `Se dio **${permission}** a ${role}.`
        )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // LOG CONFIG
  // -------------------------

  if (
    command === "valoraciones" ||
    command === "transaccion" ||
    command === "ticketlogs"
  ) {
    const channel =
      interaction.options.getChannel(
        "canal"
      );

    const key =
      command === "valoraciones"
        ? "valoraciones"
        : command === "transaccion"
          ? "transacciones"
          : "tickets";

    DATA.ticketSystem.logs[
      key
    ] = channel.id;

    save();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Canal de logs configurado en ${channel}.`
        )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // MODERATION
  // -------------------------

  if (
    command === "ban" ||
    command === "kick" ||
    command === "mute"
  ) {
    const permission =
      command;

    if (
      !hasStaffPermission(
        member,
        permission
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes permiso para esta acción."
          )
        ],
        ephemeral: true
      });
    }

    const target =
      interaction.options.getUser(
        "usuario"
      );

    const targetMember =
      await interaction.guild.members
        .fetch(target.id)
        .catch(() => null);

    const reason =
      interaction.options.getString(
        "razon"
      );

    let error = null;

    if (command === "ban") {
      error =
        await executeBan(
          interaction.guild,
          targetMember,
          interaction.user,
          reason
        );
    }

    if (command === "kick") {
      error =
        await executeKick(
          interaction.guild,
          targetMember,
          interaction.user,
          reason
        );
    }

    if (command === "mute") {
      error =
        await executeMute(
          interaction.guild,
          targetMember,
          interaction.user,
          interaction.options.getInteger(
            "minutos"
          ),
          reason
        );
    }

    return interaction.reply({
      embeds: [
        error
          ? errorEmbed(error)
          : successEmbed(
              `${command} realizado correctamente sobre ${target}.`
            )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // UNMUTE
  // -------------------------

  if (command === "unmute") {
    if (
      !hasStaffPermission(
        member,
        "unmute"
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes permiso para unmute."
          )
        ],
        ephemeral: true
      });
    }

    const target =
      interaction.options.getUser(
        "usuario"
      );

    const targetMember =
      await interaction.guild.members
        .fetch(target.id)
        .catch(() => null);

    if (!targetMember) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Ese usuario no está en el servidor."
          )
        ],
        ephemeral: true
      });
    }

    if (
      !targetMember.moderatable
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No puedo quitarle el timeout a ese usuario."
          )
        ],
        ephemeral: true
      });
    }

    const reason =
      interaction.options.getString(
        "razon"
      );

    await targetMember.timeout(
      null,
      reason ||
        `Unmute por ${interaction.user.tag}`
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `Se quitó el mute a ${target}.`
        )
      ]
    });
  }

  // -------------------------
  // UNBAN
  // -------------------------

  if (command === "unban") {
    if (
      !hasStaffPermission(
        member,
        "unban"
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes permiso para unban."
          )
        ],
        ephemeral: true
      });
    }

    const userId =
      interaction.options.getString(
        "usuario_id"
      );

    const reason =
      interaction.options.getString(
        "razon"
      );

    try {
      await interaction.guild.bans.remove(
        userId,
        reason ||
          `Unban por ${interaction.user.tag}`
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `Se desbaneó al usuario \`${userId}\`.`
          )
        ]
      });
    } catch {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No encontré un ban para ese ID o no pude quitarlo."
          )
        ],
        ephemeral: true
      });
    }
  }

  // -------------------------
  // PURGE
  // -------------------------

  if (command === "purge") {
    if (
      !hasStaffPermission(
        member,
        "purge"
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes permiso para purge."
          )
        ],
        ephemeral: true
      });
    }

    const amount =
      interaction.options.getInteger(
        "cantidad"
      );

    if (
      !interaction.channel
        ?.bulkDelete
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No puedo borrar mensajes en este canal."
          )
        ],
        ephemeral: true
      });
    }

    const deleted =
      await interaction.channel
        .bulkDelete(
          amount,
          true
        )
        .catch(() => null);

    if (!deleted) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No pude eliminar los mensajes."
          )
        ],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        successEmbed(
          `Eliminé **${deleted.size}** mensajes.`
        )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // WARN
  // -------------------------

  if (command === "warn") {
    if (
      !hasStaffPermission(
        member,
        "warn"
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes permiso para warn."
          )
        ],
        ephemeral: true
      });
    }

    const target =
      interaction.options.getUser(
        "usuario"
      );

    const reason =
      interaction.options.getString(
        "razon"
      );

    const warnings =
      ensureWarnings(
        interaction.guild.id,
        target.id
      );

    warnings.push({
      reason,
      moderatorId:
        interaction.user.id,
      timestamp:
        Date.now()
    });

    save();

    await logAction(
      interaction.guild,
      "admin",
      {
        title:
          "⚠️・Warn",
        description:
          `${target} recibió una advertencia de ${interaction.user}.\n\n` +
          `**Razón:** ${reason}`,
        color:
          COLORS.warning
      }
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `${target} recibió una advertencia.\n\n` +
          `Total: **${warnings.length}**`
        )
      ]
    });
  }

  // -------------------------
  // WARNINGS
  // -------------------------

  if (command === "warnings") {
    if (
      !hasStaffPermission(
        member,
        "warnings"
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes permiso para ver warnings."
          )
        ],
        ephemeral: true
      });
    }

    const target =
      interaction.options.getUser(
        "usuario"
      ) || interaction.user;

    const warnings =
      warningList(
        interaction.guild.id,
        target.id
      );

    return interaction.reply({
      embeds: [
        glassEmbed(COLORS.warning)
          .setTitle(
            `⚠️・Warnings de ${target.username}`
          )
          .setDescription(
            warnings.length
              ? warnings.map(
                  (warning, index) =>
                    `**${index + 1}.** ${warning.reason}\n` +
                    `Moderador: <@${warning.moderatorId}>\n` +
                    `<t:${Math.floor(
                      warning.timestamp / 1000
                    )}:R>`
                ).join("\n\n")
              : "Este usuario no tiene advertencias."
          )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // CLEAR WARNS
  // -------------------------

  if (command === "clearwarns") {
    if (
      !hasStaffPermission(
        member,
        "clearwarns"
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "No tienes permiso para eliminar warnings."
          )
        ],
        ephemeral: true
      });
    }

    const target =
      interaction.options.getUser(
        "usuario"
      );

    DATA.moderation
      .warnings[
        interaction.guild.id
      ] ??= {};

    DATA.moderation
      .warnings[
        interaction.guild.id
      ][target.id] = [];

    save();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Se eliminaron las advertencias de ${target}.`
        )
      ]
    });
  }

  // -------------------------
  // SYSTEM CHANNELS
  // -------------------------

  const channelCommands = {
    bienvenidaset:
      "bienvenida",
    inviteset:
      "invites",
    niveleset:
      "niveles",
    alianzaset:
      "alianzas",
    affysset:
      "affys",
    surgeset:
      "sugerencias"
  };

  if (
    channelCommands[command]
  ) {
    ensureSystemChannels();

    const channel =
      interaction.options.getChannel(
        "canal"
      );

    DATA.settings
      .systemChannels[
        channelCommands[command]
      ] = channel.id;

    save();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Sistema configurado en ${channel}.`
        )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // HONEYPOT
  // -------------------------

  if (
    command === "honeypotset"
  ) {
    const channel =
      interaction.options.getChannel(
        "canal"
      );

    return setupHoneyPot(
      interaction,
      channel
    );
  }

  // -------------------------
  // SAY
  // -------------------------

  if (command === "say") {
    const text =
      interaction.options.getString(
        "mensaje"
      );

    await interaction.channel.send({
      content: text
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          "Mensaje enviado."
        )
      ],
      ephemeral: true
    });
  }

  // -------------------------
  // EMBED
  // -------------------------

  if (command === "embed") {
    const color =
      interaction.options.getString(
        "color"
      );

    const message =
      interaction.options.getString(
        "mensaje"
      );

    if (
      !/^#[0-9A-F]{6}$/i.test(
        color
      )
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "El color debe tener formato `#RRGGBB`."
          )
        ],
        ephemeral: true
      });
    }

    await interaction.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setDescription(
            message
          )
          .setFooter({
            text:
              "LRM Studio  •  Fluent Glass"
          })
      ]
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          "Embed enviado."
        )
      ],
      ephemeral: true
    });
  }

  return true;
}

// =====================================================
// AUTOCOMPLETE
// =====================================================

async function handleAutocomplete(
  interaction
) {
  if (
    interaction.commandName !==
    "ticketpanel"
  ) {
    return;
  }

  const focused =
    interaction.options.getFocused();

  const choices =
    Object.values(
      DATA.ticketSystem.panels || {}
    )
      .map(
        panel => ({
          name: panel.name,
          value: panel.name
        })
      )
      .filter(
        choice =>
          choice.name
            .toLowerCase()
            .includes(
              String(
                focused
              ).toLowerCase()
            )
      )
      .slice(0, 25);

  await interaction.respond(
    choices
  ).catch(() => {});
}

// =====================================================
// INTERACCIONES DE TICKETS
// =====================================================

async function handleTicketSelect(
  interaction
) {
  const id =
    interaction.customId;

  if (
    id.startsWith(
      "ticket_create:"
    )
  ) {
    const key =
      id.split(":")[1];

    const panel =
      DATA.ticketSystem.panels[
        key
      ];

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

    return createTicket(
      interaction,
      panel
    );
  }

  if (
    id ===
    "lrm_admin_menu"
  ) {
    const value =
      interaction.values[0];

    let description =
      "Sin información.";

    if (value === "info") {
      description =
        `Servidores: **${bot.guilds.cache.size}**\n` +
        `Usuarios: **${bot.users.cache.size}**\n` +
        `Tickets abiertos: **${Object.values(
          DATA.ticketSystem.openTickets || {}
        ).reduce(
          (total, guildTickets) =>
            total +
            Object.keys(
              guildTickets || {}
            ).length,
          0
        )}**`;
    }

    if (value === "tickets") {
      description =
        `Paneles: **${Object.keys(
          DATA.ticketSystem.panels || {}
        ).length}**\n` +
        `Roles staff: **${Object.keys(
          DATA.ticketSystem.staffRoles || {}
        ).length}**`;
    }

    if (value === "logs") {
      description =
        `Valoraciones: ${
          DATA.ticketSystem.logs.valoraciones
            ? `<#${DATA.ticketSystem.logs.valoraciones}>`
            : "No configurado"
        }\n` +
        `Transacciones: ${
          DATA.ticketSystem.logs.transacciones
            ? `<#${DATA.ticketSystem.logs.transacciones}>`
            : "No configurado"
        }\n` +
        `Tickets: ${
          DATA.ticketSystem.logs.tickets
            ? `<#${DATA.ticketSystem.logs.tickets}>`
            : "No configurado"
        }`;
    }

    if (value === "moderation") {
      description =
        "Usa los comandos de moderación para gestionar el servidor.";
    }

    return interaction.update({
      embeds: [
        glassEmbed(COLORS.admin)
          .setTitle(
            `⚙️・${value}`
          )
          .setDescription(
            description
          )
      ]
    });
  }
}

async function handleTicketButton(
  interaction
) {
  const id =
    interaction.customId;

  if (
    id.startsWith(
      "ticket_claim:"
    )
  ) {
    const channelId =
      id.split(":")[1];

    const ticket =
      DATA.ticketSystem
        .openTickets?.[
          interaction.guild.id
        ]?.[channelId];

    if (!ticket) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Este ticket ya no está registrado."
          )
        ],
        ephemeral: true
      });
    }

    if (
      !hasStaffPermission(
        interaction.member,
        "reclamar_ticket"
      ) &&
      !hasStaffPermission(
        interaction.member,
        "gestionar_tickets"
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

    ticket.claimedBy =
      interaction.user.id;

    save();

    await interaction.channel.send({
      embeds: [
        glassEmbed(COLORS.info)
          .setDescription(
            `🎫 ${interaction.user} ha reclamado este ticket.`
          )
      ]
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          "Ticket reclamado."
        )
      ],
      ephemeral: true
    });
  }

  if (
    id.startsWith(
      "ticket_close:"
    )
  ) {
    return requestTicketClose(
      interaction,
      interaction.channel
    );
  }
}

// =====================================================
// MODAL DE VALORACIÓN
// =====================================================

async function handleModal(
  interaction
) {
  if (
    !interaction.customId.startsWith(
      "ticket_rating:"
    )
  ) {
    return;
  }

  const channelId =
    interaction.customId.split(":")[1];

  const ticket =
    DATA.ticketSystem
      .openTickets?.[
        interaction.guild.id
      ]?.[channelId];

  if (!ticket) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Este ticket ya no existe."
        )
      ],
      ephemeral: true
    });
  }

  const value =
    Number(
      interaction.fields.getTextInputValue(
        "rating"
      )
    );

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > 5
  ) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "La valoración debe ser un número del 1 al 5."
        )
      ],
      ephemeral: true
    });
  }

  await ratingLog(
    interaction.guild,
    interaction.channel,
    interaction.user,
    value
  );

  await ticketLog(
    interaction.guild,
    "🎫・Ticket cerrado",
    `**Usuario:** <@${ticket.userId}>\n` +
    `**Cerrado por:** ${interaction.user}\n` +
    `**Valoración:** ${value}/5`,
    COLORS.warning
  );

  delete DATA.ticketSystem
    .openTickets[
      interaction.guild.id
    ][channelId];

  save();

  await interaction.reply({
    embeds: [
      successEmbed(
        "Gracias por valorar el ticket. Se cerrará en unos segundos."
      )
    ]
  });

  setTimeout(
    () => {
      interaction.channel
        .delete(
          "Ticket cerrado"
        )
        .catch(() => {});
    },
    5000
  );
}

// =====================================================
// PREFIX ADMIN
// =====================================================

async function handlePrefix(
  message
) {
  if (
    !message.content.startsWith(
      PREFIX
    )
  ) {
    return false;
  }

  const args =
    message.content
      .slice(PREFIX.length)
      .trim()
      .split(/\s+/);

  const command =
    args.shift()
      ?.toLowerCase();

  if (!command) return false;

  const adminPrefixCommands = new Set([
    "admin",
    "addmoney",
    "removemoney",
    "say",
    "embed",
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

  if (
    !adminPrefixCommands.has(
      command
    )
  ) {
    return false;
  }

  if (
    !discordAdmin(
      message.member
    )
  ) {
    return message.reply({
      embeds: [
        errorEmbed(
          "Necesitas permisos de administrador para usar este comando."
        )
      ]
    });
  }

  const firstMention =
    message.mentions.users.first();

  const cleaned =
    [...args];

  if (
    firstMention &&
    cleaned[0]?.includes(
      firstMention.id
    )
  ) {
    cleaned.shift();
  }

  if (
    command === "admin"
  ) {
    return message.reply({
      embeds: [
        glassEmbed(COLORS.admin)
          .setTitle(
            "⚙️・LRM Studio Admin"
          )
          .setDescription(
            "Selecciona una categoría para gestionar el bot."
          )
      ],
      components: [
        buildAdminMenu()
      ]
    });
  }

  if (
    command === "addmoney" ||
    command === "removemoney"
  ) {
    const target =
      firstMention;

    const amount =
      Number(cleaned[0]);

    if (
      !target ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            `Uso: \`.${command} @usuario cantidad\``
          )
        ]
      });
    }

    const account =
      getUser(target.id);

    if (
      command === "addmoney"
    ) {
      account.wallet += amount;
    } else {
      account.wallet =
        Math.max(
          0,
          account.wallet - amount
        );
    }

    save();

    return message.reply({
      embeds: [
        successEmbed(
          `${target} ahora tiene **$${account.wallet.toLocaleString("es-ES")}**.`
        )
      ]
    });
  }

  if (
    command === "bienvenidaset" ||
    command === "inviteset" ||
    command === "niveleset" ||
    command === "alianzaset" ||
    command === "affysset" ||
    command === "surgeset"
  ) {
    const channel =
      message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [
          errorEmbed(
            `Uso: \`.${command} #canal\``
          )
        ]
      });
    }

    const keyMap = {
      bienvenidaset:
        "bienvenida",
      inviteset:
        "invites",
      niveleset:
        "niveles",
      alianzaset:
        "alianzas",
      affysset:
        "affys",
      surgeset:
        "sugerencias"
    };

    ensureSystemChannels();

    DATA.settings
      .systemChannels[
        keyMap[command]
      ] = channel.id;

    save();

    return message.reply({
      embeds: [
        successEmbed(
          `Sistema configurado en ${channel}.`
        )
      ]
    });
  }

  if (
    command ===
    "honeypotset"
  ) {
    const channel =
      message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.honeypotset #canal`"
          )
        ]
      });
    }

    return setupHoneyPot(
      {
        guild:
          message.guild,
        reply:
          payload =>
            message.reply(
              payload
            )
      },
      channel
    );
  }

  if (
    command === "ban" ||
    command === "kick"
  ) {
    const target =
      firstMention;

    const targetMember =
      target
        ? await message.guild.members
            .fetch(target.id)
            .catch(() => null)
        : null;

    const reason =
      cleaned
        .slice(0)
        .join(" ") ||
      "Sin razón";

    const error =
      command === "ban"
        ? await executeBan(
            message.guild,
            targetMember,
            message.author,
            reason
          )
        : await executeKick(
            message.guild,
            targetMember,
            message.author,
            reason
          );

    return message.reply({
      embeds: [
        error
          ? errorEmbed(error)
          : successEmbed(
              `${command} realizado correctamente.`
            )
      ]
    });
  }

  if (
    command === "mute"
  ) {
    const target =
      firstMention;

    const minutes =
      Number(cleaned[0]);

    const reason =
      cleaned
        .slice(1)
        .join(" ") ||
      "Sin razón";

    const targetMember =
      target
        ? await message.guild.members
            .fetch(target.id)
            .catch(() => null)
        : null;

    const error =
      await executeMute(
        message.guild,
        targetMember,
        message.author,
        minutes,
        reason
      );

    return message.reply({
      embeds: [
        error
          ? errorEmbed(error)
          : successEmbed(
              `Mute realizado correctamente.`
            )
      ]
    });
  }

  if (
    command === "unmute"
  ) {
    const target =
      firstMention;

    const targetMember =
      target
        ? await message.guild.members
            .fetch(target.id)
            .catch(() => null)
        : null;

    if (!targetMember) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Usuario no encontrado."
          )
        ]
      });
    }

    await targetMember
      .timeout(
        null,
        cleaned.join(" ") ||
        `Unmute por ${message.author.tag}`
      )
      .catch(() => null);

    return message.reply({
      embeds: [
        successEmbed(
          `Se quitó el mute a ${target}.`
        )
      ]
    });
  }

  if (
    command === "unban"
  ) {
    const id =
      cleaned[0];

    if (!id) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.unban ID`"
          )
        ]
      });
    }

    await message.guild.bans
      .remove(
        id,
        cleaned
          .slice(1)
          .join(" ") ||
        `Unban por ${message.author.tag}`
      )
      .catch(() => null);

    return message.reply({
      embeds: [
        successEmbed(
          `Solicitud de unban realizada para \`${id}\`.`
        )
      ]
    });
  }

  if (
    command === "purge"
  ) {
    const amount =
      Number(cleaned[0]);

    if (
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > 100
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Usa una cantidad entre 1 y 100."
          )
        ]
      });
    }

    const deleted =
      await message.channel
        .bulkDelete(
          amount,
          true
        )
        .catch(() => null);

    return message.reply({
      embeds: [
        successEmbed(
          `Eliminé **${deleted?.size || 0}** mensajes.`
        )
      ]
    });
  }

  if (
    command === "warn"
  ) {
    const target =
      firstMention;

    const reason =
      cleaned.join(" ") ||
      "Sin razón";

    if (!target) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Menciona al usuario."
          )
        ]
      });
    }

    const warnings =
      ensureWarnings(
        message.guild.id,
        target.id
      );

    warnings.push({
      reason,
      moderatorId:
        message.author.id,
      timestamp:
        Date.now()
    });

    save();

    return message.reply({
      embeds: [
        successEmbed(
          `${target} recibió una advertencia. Total: **${warnings.length}**`
        )
      ]
    });
  }

  if (
    command === "warnings"
  ) {
    const target =
      firstMention ||
      message.author;

    const warnings =
      warningList(
        message.guild.id,
        target.id
      );

    return message.reply({
      embeds: [
        glassEmbed(COLORS.warning)
          .setTitle(
            `⚠️・Warnings de ${target.username}`
          )
          .setDescription(
            warnings.length
              ? warnings.map(
                  (warning, index) =>
                    `**${index + 1}.** ${warning.reason}\n` +
                    `Moderador: <@${warning.moderatorId}>`
                ).join("\n\n")
              : "No tiene advertencias."
          )
      ]
    });
  }

  if (
    command === "clearwarns"
  ) {
    const target =
      firstMention;

    if (!target) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Menciona al usuario."
          )
        ]
      });
    }

    DATA.moderation
      .warnings[
        message.guild.id
      ] ??= {};

    DATA.moderation
      .warnings[
        message.guild.id
      ][target.id] = [];

    save();

    return message.reply({
      embeds: [
        successEmbed(
          `Warnings eliminados para ${target}.`
        )
      ]
    });
  }

  if (
    command === "say"
  ) {
    const text =
      cleaned.join(" ");

    await message.channel.send({
      content: text
    });

    return;
  }

  if (
    command === "embed"
  ) {
    const color =
      cleaned[0];

    const text =
      cleaned
        .slice(1)
        .join(" ");

    if (
      !/^#[0-9A-F]{6}$/i.test(
        color
      )
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Usa un color como `#7C8CFF`."
          )
        ]
      });
    }

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setDescription(text)
          .setFooter({
            text:
              "LRM Studio  •  Fluent Glass"
          })
      ]
    });

    return;
  }

  if (
    command === "valoraciones" ||
    command === "transaccion" ||
    command === "ticketlogs"
  ) {
    const channel =
      message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [
          errorEmbed(
            `Uso: \`.${command} #canal\``
          )
        ]
      });
    }

    const key =
      command === "valoraciones"
        ? "valoraciones"
        : command === "transaccion"
          ? "transacciones"
          : "tickets";

    DATA.ticketSystem.logs[
      key
    ] = channel.id;

    save();

    return message.reply({
      embeds: [
        successEmbed(
          `Canal configurado en ${channel}.`
        )
      ]
    });
  }

  return true;
}

// =====================================================
// EVENTOS
// =====================================================

function setupAdmin(
  client,
  options
) {
  bot = client;

  DATA =
    options.data;

  save =
    options.saveData;

  sendLog =
    options.sendLog;

  logAction =
    options.logAction;

  getUser =
    options.getUser;

  PREFIX =
    options.prefix;

  COLORS =
    options.colors;

  E =
    options.symbols;

  ensureTicketData();
  ensureSystemChannels();

  // -----------------------------------------------
  // INTERACTIONS
  // -----------------------------------------------

  client.on(
    "interactionCreate",
    async interaction => {
      try {
        if (
          interaction.isAutocomplete()
        ) {
          return handleAutocomplete(
            interaction
          );
        }

        if (
          interaction.isStringSelectMenu()
        ) {
          return handleTicketSelect(
            interaction
          );
        }

        if (
          interaction.isButton()
        ) {
          return handleTicketButton(
            interaction
          );
        }

        if (
          interaction.isModalSubmit()
        ) {
          return handleModal(
            interaction
          );
        }

        if (
          !interaction.isChatInputCommand()
        ) {
          return;
        }

        await handleAdminSlash(
          interaction
        );
      } catch (error) {
        console.error(
          "Admin interaction error:",
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
                "Ocurrió un error ejecutando la acción."
              )
            ],
            ephemeral: true
          }).catch(() => {});
        }
      }
    }
  );

  // -----------------------------------------------
  // PREFIX
  // -----------------------------------------------

  client.on(
    "messageCreate",
    async message => {
      try {
        if (
          message.author.bot ||
          !message.guild
        ) {
          return;
        }

        // HoneyPot primero
        if (
          await handleHoneyPot(
            message
          )
        ) {
          return;
        }

        // No ejecutar comandos dentro
        // del canal HoneyPot.
        if (
          DATA.honeypot?.channelId ===
          message.channel.id
        ) {
          return;
        }

        await handlePrefix(
          message
        );
      } catch (error) {
        console.error(
          "Admin prefix error:",
          error
        );
      }
    }
  );

  console.log(
    "✓ Sistema administrativo cargado."
  );
}

module.exports = {
  setupAdmin,
  adminCommands
};

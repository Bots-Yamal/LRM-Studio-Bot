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

const STAFF_ROLE_PING = "1565609209444175893";

const channelOption = (cmd, name = "canal") =>
  cmd.addChannelOption(o =>
    o.setName(name)
      .setDescription("Canal")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  );

const adminCommands = [
  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Abre el panel administrativo."),

  new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("Añade dinero a un usuario.")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("cantidad").setDescription("Cantidad").setMinValue(1).setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription("Quita dinero a un usuario.")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("cantidad").setDescription("Cantidad").setMinValue(1).setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Crea o actualiza un panel de tickets.")
    .addStringOption(o =>
      o.setName("nombre").setDescription("Nombre").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensaje_panel").setDescription("Mensaje público").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("preguntas").setDescription("0 a 2 preguntas").setMinValue(0).setMaxValue(2).setRequired(true)
    )
    .addStringOption(o =>
      o.setName("emoji").setDescription("Emoji").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensaje_ingreso").setDescription("Mensaje dentro del ticket").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("pregunta1").setDescription("Primera pregunta")
    )
    .addStringOption(o =>
      o.setName("pregunta2").setDescription("Segunda pregunta")
    ),

  channelOption(
    new SlashCommandBuilder()
      .setName("ticketpanel")
      .setDescription("Envía un panel de tickets.")
  ).addStringOption(o =>
    o.setName("panel")
      .setDescription("Panel")
      .setRequired(true)
      .setAutocomplete(true)
  ),

  new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Configura permisos internos de un rol.")
    .addRoleOption(o =>
      o.setName("rol").setDescription("Rol").setRequired(true)
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
          { name: "Mute", value: "mute" },
          { name: "Kick", value: "kick" },
          { name: "Admin total", value: "admin" }
        )
    )
    .addStringOption(o =>
      o.setName("accion")
        .setDescription("Añadir o quitar")
        .addChoices(
          { name: "Añadir", value: "add" },
          { name: "Quitar", value: "remove" }
        )
    ),

  channelOption(
    new SlashCommandBuilder()
      .setName("valoraciones")
      .setDescription("Configura valoraciones.")
  ),

  channelOption(
    new SlashCommandBuilder()
      .setName("transaccion")
      .setDescription("Configura transacciones.")
  ),

  channelOption(
    new SlashCommandBuilder()
      .setName("ticketlogs")
      .setDescription("Configura logs de tickets.")
  ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un usuario.")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa a un usuario.")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silencia temporalmente a un usuario.")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutos").setDescription("Minutos").setMinValue(1).setMaxValue(40320).setRequired(true)
    )
    .addStringOption(o =>
      o.setName("razon").setDescription("Razón")
    ),

  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Quita el timeout de un usuario.")
    .addUserOption(o =>
      o.setName("usuario").setDescription("Usuario").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Desbanea un usuario por ID.")
    .addStringOption(o =>
      o.setName("id").setDescription("ID del usuario").setRequired(true)
    ),

  channelOption(
    new SlashCommandBuilder()
      .setName("bienvenidaset")
      .setDescription("Configura el canal de bienvenida.")
  ),

  channelOption(
    new SlashCommandBuilder()
      .setName("inviteset")
      .setDescription("Configura el canal de invitaciones.")
  ),

  channelOption(
    new SlashCommandBuilder()
      .setName("niveleset")
      .setDescription("Configura el canal de niveles.")
  ),

  channelOption(
    new SlashCommandBuilder()
      .setName("alianzaset")
      .setDescription("Configura el canal de alianzas.")
  ),

  channelOption(
    new SlashCommandBuilder()
      .setName("affysset")
      .setDescription("Configura el canal de Affys.")
  ),

  channelOption(
    new SlashCommandBuilder()
      .setName("surgeset")
      .setDescription("Configura el canal de sugerencias.")
  ),

  channelOption(
    new SlashCommandBuilder()
      .setName("honeypotset")
      .setDescription("Configura e instala el Honeypot.")
  ),

  new SlashCommandBuilder()
    .setName("honeyedit")
    .setDescription("Modifica el mensaje del Honeypot.")
    .addStringOption(o =>
      o.setName("mensaje")
        .setDescription("Nuevo mensaje")
        .setRequired(true)
    )
];

let client, data, saveData, sendLog, logAction, getUser;
let PREFIX = ".";
let COLORS, E;
let registered = false;

const DEFAULT_HONEY =
`🍯・Honeypot

Este canal forma parte del sistema de seguridad de LRM Studio.

⚠️ No interactúes con este canal.

Cualquier interacción será detectada automáticamente y podrá activar las medidas de seguridad del servidor.

🛡️ LRM Studio Security`;

function ensureData() {
  data.settings ??= {};
  data.settings.logs ??= {};
  data.settings.systemChannels ??= {};

  for (const x of [
    "bienvenida",
    "invites",
    "niveles",
    "alianzas",
    "affys",
    "sugerencias",
    "honeypot"
  ]) data.settings.systemChannels[x] ??= null;

  data.honeypot ??= {
    message: DEFAULT_HONEY,
    channelId: null,
    bans: 0,
    messageId: null
  };

  data.honeypot.message ??= DEFAULT_HONEY;
  data.honeypot.channelId ??= null;
  data.honeypot.bans ??= 0;
  data.honeypot.messageId ??= null;

  data.ticketSystem ??= {};
  data.ticketSystem.panels ??= {};
  data.ticketSystem.staffRoles ??= {};
  data.ticketSystem.openTickets ??= {};
  data.ticketSystem.logs ??= {};
  data.ticketSystem.logs.valoraciones ??= null;
  data.ticketSystem.logs.transacciones ??= null;
  data.ticketSystem.logs.tickets ??= null;
}

function glassEmbed(color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: "LRM Studio  •  Fluent Glass" });
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

function panelKey(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 40) || `panel-${Date.now()}`;
}

function parseMenuEmoji(input) {
  const value = String(input || "").trim();
  const custom = value.match(/^<(a?):([A-Za-z0-9_]+):(\d+)>$/);

  if (custom) {
    return {
      id: custom[3],
      name: custom[2],
      animated: custom[1] === "a"
    };
  }

  return { name: value || "🎫" };
}

function replaceVariables(text, user, guild, panel, staff = null) {
  return String(text || "")
    .replaceAll("{usuario}", `${user}`)
    .replaceAll("{user}", `${user}`)
    .replaceAll("{servidor}", guild.name)
    .replaceAll("{panel}", panel?.name || panel || "Ticket")
    .replaceAll("{staff}", staff ? `${staff}` : "Sin reclamar");
}

function discordAdmin(member) {
  return member?.permissions?.has(PermissionFlagsBits.Administrator);
}

function getMemberPermissions(member) {
  ensureData();

  const permissions = new Set();

  if (!member) return permissions;

  if (discordAdmin(member)) {
    permissions.add("admin");
    return permissions;
  }

  for (const role of member.roles.cache.values()) {
    const stored = data.ticketSystem.staffRoles[role.id];

    if (!Array.isArray(stored)) continue;

    for (const permission of stored) {
      permissions.add(permission);
    }
  }

  return permissions;
}

function hasStaffPermission(member, permission) {
  if (discordAdmin(member)) return true;

  const permissions = getMemberPermissions(member);

  if (permissions.has("admin")) return true;

  if (
    permissions.has("gestionar_tickets") &&
    ["ver_ticket", "cerrar_ticket", "reclamar_ticket"].includes(permission)
  ) return true;

  return permissions.has(permission);
}

function canManageSystem(member) {
  return discordAdmin(member) || getMemberPermissions(member).has("admin");
}

function getTicketViewerRoles(guild) {
  const roles = [];

  for (const [roleId, permissions] of Object.entries(data.ticketSystem.staffRoles)) {
    if (!guild.roles.cache.has(roleId)) continue;

    if (
      permissions.includes("ver_ticket") ||
      permissions.includes("gestionar_tickets") ||
      permissions.includes("admin")
    ) roles.push(roleId);
  }

  return roles;
}

async function ticketLog(guild, title, description, color = COLORS.info) {
  const id = data.ticketSystem.logs.tickets;
  if (!id) return;

  const channel = guild.channels.cache.get(id);
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

async function ratingLog(guild, user, rating, ticket) {
  const id = data.ticketSystem.logs.valoraciones;
  if (!id) return;

  const channel = guild.channels.cache.get(id);
  if (!channel?.isTextBased()) return;

  await channel.send({
    embeds: [
      glassEmbed(COLORS.level)
        .setTitle(`${E.level}  Nueva valoración`)
        .setDescription(
          `${user}\nPanel: **${ticket.panelName}**\n` +
          `Valoración: **${rating}/5**\n\n` +
          `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`
        )
        .setTimestamp()
    ]
  }).catch(() => {});
}

async function syncRoleTicketPermissions(guild, roleId) {
  const permissions = data.ticketSystem.staffRoles[roleId] || [];

  const shouldView =
    permissions.includes("ver_ticket") ||
    permissions.includes("gestionar_tickets") ||
    permissions.includes("admin");

  for (const channelId of Object.keys(data.ticketSystem.openTickets)) {
    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;

    if (shouldView) {
      await channel.permissionOverwrites.edit(roleId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      }).catch(() => {});
    } else {
      await channel.permissionOverwrites.delete(roleId).catch(() => {});
    }
  }
}

async function createTicket(interaction, panel, answers = []) {
  const guild = interaction.guild;
  const user = interaction.user;

  const duplicate = Object.entries(data.ticketSystem.openTickets)
    .find(([channelId, ticket]) =>
      ticket.userId === user.id &&
      ticket.panelName === panel.name &&
      guild.channels.cache.has(channelId)
    );

  if (duplicate) {
    return interaction.reply({
      embeds: [errorEmbed(`Ya tienes un ticket abierto: <#${duplicate[0]}>`)],
      ephemeral: true
    });
  }

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
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

  for (const roleId of getTicketViewerRoles(guild)) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  const username =
    user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) ||
    "usuario";

  const channel = await guild.channels.create({
    name: `ticket-${username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: overwrites,
    reason: `Ticket de ${user.tag}`
  });

  data.ticketSystem.openTickets[channel.id] = {
    userId: user.id,
    panelName: panel.name,
    createdAt: Date.now(),
    claimedBy: null,
    closing: false,
    answers
  };

  saveData();

  let description = replaceVariables(
    panel.entryMessage,
    user,
    guild,
    panel
  );

  if (answers.length) {
    description += "\n\n### Formulario";

    for (const answer of answers) {
      description += `\n\n**${answer.question}**\n${answer.answer}`;
    }
  }

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_claim:${channel.id}`)
      .setLabel("Reclamar")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`ticket_close:${channel.id}`)
      .setLabel("Cerrar")
      .setStyle(ButtonStyle.Danger)
  );

  // CAMBIO PEDIDO:
  // usuario + rol fuera del embed.
  await channel.send({
    content: `${user} <@&${STAFF_ROLE_PING}>`,
    embeds: [
      glassEmbed(COLORS.primary)
        .setTitle(`${panel.emoji || "🎫"}  ${panel.name}`)
        .setDescription(description)
    ],
    components: [buttons]
  });

  await ticketLog(
    guild,
    `${E.success} Ticket creado`,
    `${user} creó ${channel}.\nPanel: **${panel.name}**`,
    COLORS.success
  );

  return interaction.reply({
    embeds: [successEmbed(`Tu ticket fue creado: ${channel}`)],
    ephemeral: true
  });
}

async function requestTicketClose(interaction, ticket) {
  if (ticket.closing) {
    return interaction.reply({
      embeds: [errorEmbed("Este ticket ya está cerrándose.")],
      ephemeral: true
    });
  }

  ticket.closing = true;
  saveData();

  const row = new ActionRowBuilder();

  for (let i = 1; i <= 5; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_rating:${i}:${interaction.channel.id}`)
        .setLabel(String(i))
        .setStyle(
          i === 5
            ? ButtonStyle.Success
            : i === 4
              ? ButtonStyle.Primary
              : ButtonStyle.Secondary
        )
    );
  }

  return interaction.reply({
    content: `<@${ticket.userId}>`,
    embeds: [
      glassEmbed(COLORS.level)
        .setTitle("✦ Valora la atención")
        .setDescription("Selecciona una valoración del **1 al 5**.")
    ],
    components: [row]
  });
}

function adminMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("lrm_admin_menu")
      .setPlaceholder("LRM Studio • Administración")
      .addOptions(
        {
          label: "Moderación",
          value: "moderacion",
          description: "Ban, mute, kick..."
        },
        {
          label: "Tickets",
          value: "tickets",
          description: "Tickets y staff"
        },
        {
          label: "Sistemas",
          value: "sistemas",
          description: "Bienvenida, invites, niveles..."
        },
        {
          label: "Economía",
          value: "economia",
          description: "Administrar balances"
        },
        {
          label: "Seguridad",
          value: "seguridad",
          description: "HoneyPot"
        }
      )
  );
}

async function showAdmin(target, slash = false) {
  return target.reply({
    embeds: [
      glassEmbed(COLORS.admin)
        .setTitle("⚙ LRM Studio Admin")
        .setDescription("Selecciona una sección.")
    ],
    components: [adminMenu()],
    ...(slash ? { ephemeral: true } : {})
  });
}

async function setSystemChannel(interaction, key, title) {
  const channel = interaction.options.getChannel("canal");

  data.settings.systemChannels[key] = channel.id;
  saveData();

  return interaction.reply({
    embeds: [successEmbed(`${title} → ${channel}`)]
  });
}

async function installHoneyPot(guild, channel) {
  data.honeypot.channelId = channel.id;
  data.settings.systemChannels.honeypot = channel.id;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("honeypot_counter")
      .setLabel(`Ban: ${data.honeypot.bans}`)
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );

  const sent = await channel.send({
    embeds: [
      glassEmbed(COLORS.warning)
        .setDescription(data.honeypot.message)
    ],
    components: [row]
  });

  data.honeypot.messageId = sent.id;
  saveData();
}

async function handleModerationSlash(interaction, command) {
  const permission =
    command === "unmute"
      ? "mute"
      : command === "unban"
        ? "ban"
        : command;

  if (!hasStaffPermission(interaction.member, permission)) {
    return interaction.reply({
      embeds: [errorEmbed(`No tienes permiso **${permission}**.`)],
      ephemeral: true
    });
  }

  if (command === "unban") {
    const id = interaction.options.getString("id");

    try {
      await interaction.guild.members.unban(
        id,
        `Unban por ${interaction.user.tag}`
      );

      return interaction.reply({
        embeds: [successEmbed(`Usuario \`${id}\` desbaneado.`)]
      });
    } catch {
      return interaction.reply({
        embeds: [errorEmbed("No pude desbanear ese ID.")],
        ephemeral: true
      });
    }
  }

  const user = interaction.options.getUser("usuario");

  const member = await interaction.guild.members
    .fetch(user.id)
    .catch(() => null);

  if (!member) {
    return interaction.reply({
      embeds: [errorEmbed("No encontré ese miembro.")],
      ephemeral: true
    });
  }

  const reason =
    interaction.options.getString("razon") ||
    `Moderación por ${interaction.user.tag}`;

  if (command === "ban") {
    if (!member.bannable) {
      return interaction.reply({
        embeds: [errorEmbed("No puedo banear a ese miembro.")],
        ephemeral: true
      });
    }

    await member.ban({ reason });

    await logAction(interaction.guild, "admin", {
      title: "⚙ Ban",
      description: `${interaction.user} baneó a ${user}.\nRazón: **${reason}**`,
      color: COLORS.error
    });

    return interaction.reply({
      embeds: [successEmbed(`${user.tag} fue baneado.`)]
    });
  }

  if (command === "kick") {
    if (!member.kickable) {
      return interaction.reply({
        embeds: [errorEmbed("No puedo expulsar a ese miembro.")],
        ephemeral: true
      });
    }

    await member.kick(reason);

    return interaction.reply({
      embeds: [successEmbed(`${user.tag} fue expulsado.`)]
    });
  }

  if (command === "mute") {
    const minutes = interaction.options.getInteger("minutos");

    if (!member.moderatable) {
      return interaction.reply({
        embeds: [errorEmbed("No puedo silenciar a ese miembro.")],
        ephemeral: true
      });
    }

    await member.timeout(minutes * 60_000, reason);

    return interaction.reply({
      embeds: [
        successEmbed(
          `${user.tag} fue silenciado durante **${minutes} minutos**.`
        )
      ]
    });
  }

  if (command === "unmute") {
    if (!member.moderatable) {
      return interaction.reply({
        embeds: [errorEmbed("No puedo modificar a ese miembro.")],
        ephemeral: true
      });
    }

    await member.timeout(null, `Unmute por ${interaction.user.tag}`);

    return interaction.reply({
      embeds: [successEmbed(`Se quitó el mute de ${user}.`)]
    });
  }
}

async function handleSlash(interaction) {
  const command = interaction.commandName;

  if (!adminCommands.some(c => c.name === command)) return;

  if (["ban", "kick", "mute", "unmute", "unban"].includes(command)) {
    return handleModerationSlash(interaction, command);
  }

  if (!canManageSystem(interaction.member)) {
    return interaction.reply({
      embeds: [errorEmbed("Necesitas permisos administrativos.")],
      ephemeral: true
    });
  }

  if (command === "admin") {
    return showAdmin(interaction, true);
  }

  if (command === "addmoney" || command === "removemoney") {
    const user = interaction.options.getUser("usuario");
    const amount = interaction.options.getInteger("cantidad");
    const account = getUser(user.id);

    if (command === "addmoney") {
      account.wallet += amount;
    } else {
      account.wallet -= Math.min(Math.max(account.wallet, 0), amount);
    }

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `${user}\nWallet: **$${account.wallet.toLocaleString("es-ES")}**`
        )
      ]
    });
  }

  const channelCommands = {
    bienvenidaset: ["bienvenida", "Bienvenidas"],
    inviteset: ["invites", "Invites"],
    niveleset: ["niveles", "Niveles"],
    alianzaset: ["alianzas", "Alianzas"],
    affysset: ["affys", "Affys"],
    surgeset: ["sugerencias", "Sugerencias"]
  };

  if (channelCommands[command]) {
    const [key, title] = channelCommands[command];
    return setSystemChannel(interaction, key, title);
  }

  if (command === "honeypotset") {
    const channel = interaction.options.getChannel("canal");

    await installHoneyPot(interaction.guild, channel);

    return interaction.reply({
      embeds: [successEmbed(`HoneyPot instalado en ${channel}.`)],
      ephemeral: true
    });
  }

  if (command === "honeyedit") {
    data.honeypot.message = interaction.options.getString("mensaje");
    saveData();

    return interaction.reply({
      embeds: [successEmbed("Mensaje del HoneyPot actualizado.")],
      ephemeral: true
    });
  }

  if (command === "panel") {
    const name = interaction.options.getString("nombre").trim();
    const key = panelKey(name);
    const count = interaction.options.getInteger("preguntas");

    const q1 = interaction.options.getString("pregunta1");
    const q2 = interaction.options.getString("pregunta2");

    if (count >= 1 && !q1) {
      return interaction.reply({
        embeds: [errorEmbed("Falta `pregunta1`.")],
        ephemeral: true
      });
    }

    if (count === 2 && !q2) {
      return interaction.reply({
        embeds: [errorEmbed("Falta `pregunta2`.")],
        ephemeral: true
      });
    }

    const questions = [];
    if (count >= 1) questions.push(q1);
    if (count >= 2) questions.push(q2);

    data.ticketSystem.panels[key] = {
      key,
      name,
      panelMessage: interaction.options.getString("mensaje_panel"),
      emoji: interaction.options.getString("emoji"),
      entryMessage: interaction.options.getString("mensaje_ingreso"),
      questions
    };

    saveData();

    return interaction.reply({
      embeds: [successEmbed(`Panel **${name}** guardado.`)],
      ephemeral: true
    });
  }

  if (command === "ticketpanel") {
    const channel = interaction.options.getChannel("canal");
    const value = interaction.options.getString("panel");

    const panel =
      data.ticketSystem.panels[value] ||
      Object.values(data.ticketSystem.panels).find(
        p => p.name.toLowerCase() === value.toLowerCase()
      );

    if (!panel) {
      return interaction.reply({
        embeds: [errorEmbed("No encontré ese panel.")],
        ephemeral: true
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`ticket_create:${panel.key}`)
      .setPlaceholder("Selecciona para crear un ticket")
      .addOptions({
        label: panel.name.slice(0, 100),
        value: "create",
        description: "Abrir un nuevo ticket",
        emoji: parseMenuEmoji(panel.emoji)
      });

    await channel.send({
      embeds: [
        glassEmbed(COLORS.primary)
          .setTitle(`${panel.emoji || "🎫"} ${panel.name}`)
          .setDescription(panel.panelMessage)
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });

    return interaction.reply({
      embeds: [successEmbed(`Panel enviado en ${channel}.`)],
      ephemeral: true
    });
  }

  if (command === "staff") {
    const role = interaction.options.getRole("rol");
    const permission = interaction.options.getString("permiso");
    const action = interaction.options.getString("accion") || "add";

    data.ticketSystem.staffRoles[role.id] ??= [];

    if (action === "add") {
      if (!data.ticketSystem.staffRoles[role.id].includes(permission)) {
        data.ticketSystem.staffRoles[role.id].push(permission);
      }
    } else {
      data.ticketSystem.staffRoles[role.id] =
        data.ticketSystem.staffRoles[role.id].filter(p => p !== permission);
    }

    saveData();
    await syncRoleTicketPermissions(interaction.guild, role.id);

    return interaction.reply({
      embeds: [
        successEmbed(
          `${action === "add" ? "Añadido" : "Eliminado"} **${permission}** en ${role}.`
        )
      ]
    });
  }

  const logMap = {
    valoraciones: "valoraciones",
    transaccion: "transacciones",
    ticketlogs: "tickets"
  };

  if (logMap[command]) {
    const channel = interaction.options.getChannel("canal");
    data.ticketSystem.logs[logMap[command]] = channel.id;
    saveData();

    return interaction.reply({
      embeds: [successEmbed(`${command} → ${channel}`)]
    });
  }
}

async function handleAutocomplete(interaction) {
  if (
    !interaction.isAutocomplete() ||
    interaction.commandName !== "ticketpanel"
  ) return;

  const focused = interaction.options.getFocused().toLowerCase();

  const panels = Object.values(data.ticketSystem.panels)
    .filter(
      p =>
        p.name.toLowerCase().includes(focused) ||
        p.key.includes(focused)
    )
    .slice(0, 25);

  await interaction.respond(
    panels.map(p => ({
      name: p.name.slice(0, 100),
      value: p.key
    }))
  ).catch(() => {});
}

async function handleSelect(interaction) {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "lrm_admin_menu") {
    if (!canManageSystem(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed("No tienes permisos.")],
        ephemeral: true
      });
    }

    const sections = {
      moderacion:
        "**Moderación**\n`/ban` `/kick` `/mute` `/unmute` `/unban`",

      tickets:
        "**Tickets**\n`/panel` `/ticketpanel` `/staff` `/valoraciones` `/ticketlogs`",

      sistemas:
        "**Sistemas**\n`/bienvenidaset` `/inviteset` `/niveleset`\n`/alianzaset` `/affysset` `/surgeset`",

      economia:
        "**Economía administrativa**\n`/addmoney` `/removemoney`",

      seguridad:
        "**Seguridad**\n`/honeypotset` `/honeyedit`"
    };

    return interaction.update({
      embeds: [
        glassEmbed(COLORS.admin)
          .setTitle("⚙ LRM Studio Admin")
          .setDescription(sections[interaction.values[0]] || "Sin información.")
      ],
      components: [adminMenu()]
    });
  }

  if (interaction.customId.startsWith("ticket_create:")) {
    const key = interaction.customId.split(":")[1];
    const panel = data.ticketSystem.panels[key];

    if (!panel) {
      return interaction.reply({
        embeds: [errorEmbed("Este panel ya no existe.")],
        ephemeral: true
      });
    }

    if (!panel.questions.length) {
      return createTicket(interaction, panel, []);
    }

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal:${key}`)
      .setTitle(`Ticket • ${panel.name}`.slice(0, 45));

    panel.questions.forEach((question, index) => {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(`answer_${index}`)
            .setLabel(question.slice(0, 45))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(1000)
        )
      );
    });

    return interaction.showModal(modal);
  }
}

async function handleModal(interaction) {
  if (
    !interaction.isModalSubmit() ||
    !interaction.customId.startsWith("ticket_modal:")
  ) return;

  const key = interaction.customId.split(":")[1];
  const panel = data.ticketSystem.panels[key];

  if (!panel) {
    return interaction.reply({
      embeds: [errorEmbed("Este panel ya no existe.")],
      ephemeral: true
    });
  }

  const answers = panel.questions.map((question, index) => ({
    question,
    answer: interaction.fields.getTextInputValue(`answer_${index}`)
  }));

  return createTicket(interaction, panel, answers);
}

async function handleButtons(interaction) {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith("ticket_claim:")) {
    const id = interaction.customId.split(":")[1];
    const ticket = data.ticketSystem.openTickets[id];

    if (!ticket) {
      return interaction.reply({
        embeds: [errorEmbed("Este ticket ya no existe.")],
        ephemeral: true
      });
    }

    if (!hasStaffPermission(interaction.member, "reclamar_ticket")) {
      return interaction.reply({
        embeds: [errorEmbed("No puedes reclamar tickets.")],
        ephemeral: true
      });
    }

    if (ticket.claimedBy) {
      return interaction.reply({
        embeds: [errorEmbed(`Ya fue reclamado por <@${ticket.claimedBy}>.`)],
        ephemeral: true
      });
    }

    ticket.claimedBy = interaction.user.id;
    saveData();

    return interaction.reply({
      embeds: [successEmbed(`Ticket reclamado por ${interaction.user}.`)]
    });
  }

  if (interaction.customId.startsWith("ticket_close:")) {
    const id = interaction.customId.split(":")[1];
    const ticket = data.ticketSystem.openTickets[id];

    if (!ticket) {
      return interaction.reply({
        embeds: [errorEmbed("Este ticket ya no existe.")],
        ephemeral: true
      });
    }

    if (
      interaction.user.id !== ticket.userId &&
      !hasStaffPermission(interaction.member, "cerrar_ticket")
    ) {
      return interaction.reply({
        embeds: [errorEmbed("No puedes cerrar este ticket.")],
        ephemeral: true
      });
    }

    return requestTicketClose(interaction, ticket);
  }

  if (interaction.customId.startsWith("ticket_rating:")) {
    const [, ratingRaw, channelId] = interaction.customId.split(":");
    const rating = Number(ratingRaw);
    const ticket = data.ticketSystem.openTickets[channelId];

    if (!ticket) {
      return interaction.reply({
        embeds: [errorEmbed("Este ticket ya fue cerrado.")],
        ephemeral: true
      });
    }

    if (interaction.user.id !== ticket.userId) {
      return interaction.reply({
        embeds: [errorEmbed("Solo el creador puede valorar.")],
        ephemeral: true
      });
    }

    await ratingLog(interaction.guild, interaction.user, rating, ticket);

    delete data.ticketSystem.openTickets[channelId];
    saveData();

    await interaction.update({
      embeds: [
        glassEmbed(COLORS.warning)
          .setTitle("✓ Valoración recibida")
          .setDescription(
            `Gracias por valorar con **${rating}/5**.\n\n` +
            "Este ticket se cerrará en **5 segundos**."
          )
      ],
      components: []
    });

    setTimeout(() => {
      interaction.channel.delete("Ticket cerrado").catch(() => {});
    }, 5000);
  }
}

async function handleHoneyPotMessage(message) {
  if (
    message.author.bot ||
    !message.guild ||
    !data.honeypot?.channelId ||
    message.channel.id !== data.honeypot.channelId
  ) return false;

  // No castiga administradores.
  if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    return false;
  }

  if (!message.member?.bannable) {
    return false;
  }

  await message.member.ban({
    reason: "LRM Studio HoneyPot"
  }).catch(() => null);

  data.honeypot.bans++;
  saveData();

  if (data.honeypot.messageId) {
    const panel = await message.channel.messages
      .fetch(data.honeypot.messageId)
      .catch(() => null);

    if (panel) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("honeypot_counter")
          .setLabel(`Ban: ${data.honeypot.bans}`)
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );

      await panel.edit({ components: [row] }).catch(() => {});
    }
  }

  return true;
}

async function handlePrefix(message) {
  if (
    message.author.bot ||
    !message.guild ||
    !message.content.startsWith(PREFIX)
  ) return;

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

  const command = args.shift()?.toLowerCase();
  if (!command) return;

  const adminOnly = [
    "admin",
    "addmoney",
    "removemoney",
    "say",
    "embed",
    "setlog",
    "logs",
    "ticketpanel",
    "staff",
    "valoraciones",
    "transaccion",
    "ticketlogs",
    "bienvenidaset",
    "inviteset",
    "niveleset",
    "alianzaset",
    "affysset",
    "surgeset",
    "honeypotset",
    "honeyedit"
  ];

  if (!adminOnly.includes(command)) return;

  if (!canManageSystem(message.member)) {
    return message.reply({
      embeds: [errorEmbed("No tienes permisos administrativos.")]
    });
  }

  if (command === "admin") return showAdmin(message);

  if (command === "addmoney" || command === "removemoney") {
    const target = message.mentions.users.first();
    const amount = Number(args[1]);

    if (!target || !Number.isInteger(amount) || amount <= 0) {
      return message.reply({
        embeds: [errorEmbed(`Uso: \`.${command} @usuario cantidad\``)]
      });
    }

    const account = getUser(target.id);

    if (command === "addmoney") {
      account.wallet += amount;
    } else {
      account.wallet -= Math.min(Math.max(account.wallet, 0), amount);
    }

    saveData();

    return message.reply({
      embeds: [
        successEmbed(
          `${target}\nWallet: **$${account.wallet.toLocaleString("es-ES")}**`
        )
      ]
    });
  }

  if (command === "say") {
    const text = args.join(" ");
    if (!text) return;

    await message.delete().catch(() => {});
    return message.channel.send(text);
  }

  if (command === "embed") {
    const text = args.join(" ");
    if (!text) return;

    await message.delete().catch(() => {});

    return message.channel.send({
      embeds: [glassEmbed().setDescription(text)]
    });
  }

  const systemMap = {
    bienvenidaset: ["bienvenida", "Bienvenidas"],
    inviteset: ["invites", "Invites"],
    niveleset: ["niveles", "Niveles"],
    alianzaset: ["alianzas", "Alianzas"],
    affysset: ["affys", "Affys"],
    surgeset: ["sugerencias", "Sugerencias"]
  };

  if (systemMap[command]) {
    const channel = message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [errorEmbed(`Uso: \`.${command} #canal\``)]
      });
    }

    const [key, title] = systemMap[command];

    data.settings.systemChannels[key] = channel.id;
    saveData();

    return message.reply({
      embeds: [successEmbed(`${title} → ${channel}`)]
    });
  }

  if (command === "honeypotset") {
    const channel = message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [errorEmbed("Uso: `.honeypotset #canal`")]
      });
    }

    await installHoneyPot(message.guild, channel);

    return message.reply({
      embeds: [successEmbed(`HoneyPot instalado en ${channel}.`)]
    });
  }

  if (command === "honeyedit") {
    const text = args.join(" ");

    if (!text) {
      return message.reply({
        embeds: [errorEmbed("Uso: `.honeyedit mensaje`")]
      });
    }

    data.honeypot.message = text;
    saveData();

    return message.reply({
      embeds: [successEmbed("HoneyPot actualizado.")]
    });
  }

  if (command === "setlog") {
    const type = args[0]?.toLowerCase();
    const channel = message.mentions.channels.first();

    if (
      !["general", "economia", "tienda", "niveles", "admin"].includes(type) ||
      !channel
    ) {
      return message.reply({
        embeds: [errorEmbed("Uso: `.setlog tipo #canal`")]
      });
    }

    data.settings.logs[type] = channel.id;
    saveData();

    return message.reply({
      embeds: [successEmbed(`Log **${type}** → ${channel}`)]
    });
  }

  if (command === "logs") {
    const logs = data.settings.logs;

    return message.reply({
      embeds: [
        glassEmbed(COLORS.admin)
          .setTitle("⌁ Logs")
          .setDescription(
            `General: ${logs.general ? `<#${logs.general}>` : "No"}\n` +
            `Economía: ${logs.economia ? `<#${logs.economia}>` : "No"}\n` +
            `Tienda: ${logs.tienda ? `<#${logs.tienda}>` : "No"}\n` +
            `Niveles: ${logs.niveles ? `<#${logs.niveles}>` : "No"}\n` +
            `Admin: ${logs.admin ? `<#${logs.admin}>` : "No"}`
          )
      ]
    });
  }

  if (["valoraciones", "transaccion", "ticketlogs"].includes(command)) {
    const channel = message.mentions.channels.first();

    if (!channel) return;

    const key =
      command === "valoraciones"
        ? "valoraciones"
        : command === "transaccion"
          ? "transacciones"
          : "tickets";

    data.ticketSystem.logs[key] = channel.id;
    saveData();

    return message.reply({
      embeds: [successEmbed(`${command} → ${channel}`)]
    });
  }
}

function setupAdmin(discordClient, options) {
  client = discordClient;
  data = options.data;
  saveData = options.saveData;
  sendLog = options.sendLog;
  logAction = options.logAction;
  getUser = options.getUser;
  PREFIX = options.prefix || ".";
  COLORS = options.colors;
  E = options.symbols;

  ensureData();

  if (registered) return;
  registered = true;

  client.on("interactionCreate", async interaction => {
    try {
      if (interaction.isAutocomplete()) return handleAutocomplete(interaction);
      if (interaction.isChatInputCommand()) return handleSlash(interaction);
      if (interaction.isStringSelectMenu()) return handleSelect(interaction);
      if (interaction.isModalSubmit()) return handleModal(interaction);
      if (interaction.isButton()) return handleButtons(interaction);
    } catch (error) {
      console.error("Admin interaction error:", error);

      if (
        interaction.isRepliable() &&
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          embeds: [errorEmbed("Ocurrió un error.")],
          ephemeral: true
        }).catch(() => {});
      }
    }
  });

  client.on("messageCreate", async message => {
    try {
      const trapped = await handleHoneyPotMessage(message);
      if (trapped) return;

      await handlePrefix(message);
    } catch (error) {
      console.error("Admin message error:", error);
    }
  });
}

module.exports = {
  setupAdmin,
  adminCommands
};

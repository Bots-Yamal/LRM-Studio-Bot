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

// =====================================================
// SLASH COMMANDS ADMIN
// =====================================================

const adminCommands = [
  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Abre el panel administrativo."),

  new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("Añade dinero a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad")
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription("Quita dinero a un usuario.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("cantidad")
        .setDescription("Cantidad")
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Crea o actualiza un panel de tickets.")
    .addStringOption(option =>
      option
        .setName("nombre")
        .setDescription("Nombre del panel")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("mensaje_panel")
        .setDescription("Mensaje público del panel")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("preguntas")
        .setDescription("Cantidad de preguntas")
        .setMinValue(0)
        .setMaxValue(2)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("emoji")
        .setDescription("Emoji del panel")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("mensaje_ingreso")
        .setDescription("Mensaje al entrar al ticket")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("pregunta1")
        .setDescription("Primera pregunta")
    )
    .addStringOption(option =>
      option
        .setName("pregunta2")
        .setDescription("Segunda pregunta")
    ),

  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription("Envía un panel de tickets.")
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal donde enviar el panel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("panel")
        .setDescription("Nombre del panel")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  new SlashCommandBuilder()
    .setName("staff")
    .setDescription("Configura los permisos internos de un rol.")
    .addRoleOption(option =>
      option
        .setName("rol")
        .setDescription("Rol de staff")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("permiso")
        .setDescription("Permiso interno")
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
    .addStringOption(option =>
      option
        .setName("accion")
        .setDescription("Añadir o quitar permiso")
        .addChoices(
          { name: "Añadir", value: "add" },
          { name: "Quitar", value: "remove" }
        )
    ),

  new SlashCommandBuilder()
    .setName("valoraciones")
    .setDescription("Configura el canal de valoraciones.")
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal de valoraciones")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("transaccion")
    .setDescription("Configura el canal de transacciones.")
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal de transacciones")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticketlogs")
    .setDescription("Configura los logs de tickets.")
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription("Canal de logs")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banea a un miembro.")
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
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsa a un miembro.")
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
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silencia temporalmente a un miembro.")
    .addUserOption(option =>
      option
        .setName("usuario")
        .setDescription("Usuario")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minutos")
        .setDescription("Duración en minutos")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("razon")
        .setDescription("Razón")
    )
];

// =====================================================
// VARIABLES COMPARTIDAS CON INDEX.JS
// =====================================================

let client;
let data;
let saveData;
let sendLog;
let logAction;
let getUser;

let PREFIX = ".";
let COLORS;
let E;

let registered = false;

// =====================================================
// UTILIDADES
// =====================================================

function ensureTicketData() {
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

function panelKey(name) {
  const key = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 40);

  return key || `panel-${Date.now()}`;
}

function parseMenuEmoji(input) {
  const value = String(input || "").trim();

  const custom = value.match(
    /^<(a?):([A-Za-z0-9_]+):(\d+)>$/
  );

  if (custom) {
    return {
      id: custom[3],
      name: custom[2],
      animated: custom[1] === "a"
    };
  }

  if (value) {
    return {
      name: value
    };
  }

  return {
    name: "🎫"
  };
}

function replaceVariables(text, user, guild, panel, staff = null) {
  return String(text || "")
    .replaceAll("{usuario}", `${user}`)
    .replaceAll("{user}", `${user}`)
    .replaceAll("{servidor}", guild.name)
    .replaceAll("{panel}", panel?.name || panel || "Ticket")
    .replaceAll(
      "{staff}",
      staff ? `${staff}` : "Sin reclamar"
    );
}

// =====================================================
// PERMISOS INTERNOS
// =====================================================

function discordAdmin(member) {
  return member?.permissions?.has(
    PermissionFlagsBits.Administrator
  );
}

function getMemberPermissions(member) {
  ensureTicketData();

  const permissions = new Set();

  if (!member) return permissions;

  if (discordAdmin(member)) {
    permissions.add("admin");
    return permissions;
  }

  for (const role of member.roles.cache.values()) {
    const stored =
      data.ticketSystem.staffRoles[role.id];

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

  if (permissions.has("admin")) {
    return true;
  }

  if (
    permissions.has("gestionar_tickets") &&
    [
      "ver_ticket",
      "cerrar_ticket",
      "reclamar_ticket"
    ].includes(permission)
  ) {
    return true;
  }

  return permissions.has(permission);
}

function canManageSystem(member) {
  return (
    discordAdmin(member) ||
    getMemberPermissions(member).has("admin")
  );
}

function getTicketViewerRoles(guild) {
  ensureTicketData();

  const roles = [];

  for (const [roleId, permissions] of Object.entries(
    data.ticketSystem.staffRoles
  )) {
    if (!guild.roles.cache.has(roleId)) continue;

    if (
      permissions.includes("ver_ticket") ||
      permissions.includes("gestionar_tickets") ||
      permissions.includes("admin")
    ) {
      roles.push(roleId);
    }
  }

  return roles;
}

// =====================================================
// LOGS DE TICKETS
// =====================================================

async function ticketLog(guild, title, description, color = COLORS.info) {
  ensureTicketData();

  const channelId = data.ticketSystem.logs.tickets;

  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);

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
  const channelId =
    data.ticketSystem.logs.valoraciones;

  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);

  if (!channel?.isTextBased()) return;

  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  await channel.send({
    embeds: [
      glassEmbed(COLORS.level)
        .setTitle(`${E.level}  Nueva valoración`)
        .setDescription(
          `${E.user} Usuario: ${user}\n` +
          `${E.info} Panel: **${ticket.panelName}**\n` +
          `${E.level} Valoración: **${rating}/5**\n\n` +
          `${stars}`
        )
        .setTimestamp()
    ]
  }).catch(() => {});
}

// =====================================================
// ACTUALIZAR PERMISOS DE TICKETS EXISTENTES
// =====================================================

async function syncRoleTicketPermissions(guild, roleId) {
  ensureTicketData();

  const permissions =
    data.ticketSystem.staffRoles[roleId] || [];

  const shouldView =
    permissions.includes("ver_ticket") ||
    permissions.includes("gestionar_tickets") ||
    permissions.includes("admin");

  for (const channelId of Object.keys(
    data.ticketSystem.openTickets
  )) {
    const channel = guild.channels.cache.get(channelId);

    if (!channel) continue;

    if (shouldView) {
      await channel.permissionOverwrites.edit(roleId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      }).catch(() => {});
    } else {
      await channel.permissionOverwrites
        .delete(roleId)
        .catch(() => {});
    }
  }
}

// =====================================================
// CREAR TICKET
// =====================================================

async function createTicket(interaction, panel, answers = []) {
  ensureTicketData();

  const guild = interaction.guild;
  const user = interaction.user;

  const duplicate = Object.entries(
    data.ticketSystem.openTickets
  ).find(([channelId, ticket]) => {
    return (
      ticket.userId === user.id &&
      ticket.panelName === panel.name &&
      guild.channels.cache.has(channelId)
    );
  });

  if (duplicate) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          `Ya tienes un ticket abierto de **${panel.name}**: <#${duplicate[0]}>`
        )
      ],
      ephemeral: true
    });
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
    }
  ];

  for (const roleId of getTicketViewerRoles(guild)) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    });
  }

  const username =
    user.username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 15) || "usuario";

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
      description +=
        `\n\n**${answer.question}**\n${answer.answer}`;
    }
  }

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_claim:${channel.id}`)
        .setLabel("Reclamar")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`ticket_close:${channel.id}`)
        .setLabel("Cerrar")
        .setStyle(ButtonStyle.Danger)
    );

  await channel.send({
    content: `${user}`,
    embeds: [
      glassEmbed(COLORS.primary)
        .setTitle(`${panel.emoji || "🎫"}  ${panel.name}`)
        .setDescription(description)
    ],
    components: [buttons]
  });

  await ticketLog(
    guild,
    `${E.success}  Ticket creado`,
    `${user} creó ${channel}.\n\nPanel: **${panel.name}**`,
    COLORS.success
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

async function requestTicketClose(interaction, ticket) {
  if (ticket.closing) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Este ticket ya está en proceso de cierre."
        )
      ],
      ephemeral: true
    });
  }

  ticket.closing = true;
  saveData();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_rating:1:${interaction.channel.id}`)
        .setLabel("1")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`ticket_rating:2:${interaction.channel.id}`)
        .setLabel("2")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`ticket_rating:3:${interaction.channel.id}`)
        .setLabel("3")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`ticket_rating:4:${interaction.channel.id}`)
        .setLabel("4")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`ticket_rating:5:${interaction.channel.id}`)
        .setLabel("5")
        .setStyle(ButtonStyle.Success)
    );

  return interaction.reply({
    content: `<@${ticket.userId}>`,
    embeds: [
      glassEmbed(COLORS.level)
        .setTitle(`${E.level}  Valora la atención`)
        .setDescription(
          `Selecciona una valoración del **1 al 5** antes de cerrar el ticket.\n\n` +
          `**1**  Muy mala\n` +
          `**2**  Mala\n` +
          `**3**  Normal\n` +
          `**4**  Buena\n` +
          `**5**  Excelente`
        )
    ],
    components: [row]
  });
}

// =====================================================
// PANEL ADMIN
// =====================================================

function adminMenu() {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("lrm_admin_menu")
        .setPlaceholder("LRM Studio • Administración")
        .addOptions(
          {
            label: "Administración",
            value: "administracion",
            description: "Herramientas administrativas"
          },
          {
            label: "Tickets",
            value: "tickets",
            description: "Paneles, staff y logs"
          },
          {
            label: "Economía",
            value: "economia",
            description: "Administrar balances"
          },
          {
            label: "Mensajes",
            value: "mensajes",
            description: "Say y embeds"
          },
          {
            label: "Tienda",
            value: "tienda",
            description: "Administrar productos"
          },
          {
            label: "Logs",
            value: "logs",
            description: "Configuración de logs"
          }
        )
    );
}

async function showAdmin(target, slash = false) {
  const payload = {
    embeds: [
      glassEmbed(COLORS.admin)
        .setTitle(`${E.admin}  LRM Studio Admin`)
        .setDescription(
          `Panel administrativo de **LRM Studio**.\n\n` +
          `Selecciona una sección para ver sus comandos.`
        )
    ],
    components: [adminMenu()]
  };

  if (slash) {
    payload.ephemeral = true;
  }

  return target.reply(payload);
}

// =====================================================
// SLASH HANDLER
// =====================================================

async function handleSlash(interaction) {
  const command = interaction.commandName;

  if (!adminCommands.some(c => c.name === command)) {
    return;
  }

  // Moderación usa permisos separados.
  if (["ban", "kick", "mute"].includes(command)) {
    const permission = command;

    if (!hasStaffPermission(interaction.member, permission)) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            `No tienes el permiso interno **${permission}**.`
          )
        ],
        ephemeral: true
      });
    }

    const user =
      interaction.options.getUser("usuario");

    const member =
      await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

    if (!member) {
      return interaction.reply({
        embeds: [
          errorEmbed("No encontré a ese miembro.")
        ],
        ephemeral: true
      });
    }

    const reason =
      interaction.options.getString("razon") ||
      `Moderación por ${interaction.user.tag}`;

    if (command === "ban") {
      if (!member.bannable) {
        return interaction.reply({
          embeds: [
            errorEmbed("No puedo banear a ese miembro.")
          ],
          ephemeral: true
        });
      }

      await member.ban({
        reason
      });

      await logAction(
        interaction.guild,
        "admin",
        {
          title: `${E.admin} Ban`,
          description:
            `${interaction.user} baneó a ${user}.\n\n` +
            `Razón: **${reason}**`,
          color: COLORS.error
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(`${user.tag} fue baneado.`)
        ]
      });
    }

    if (command === "kick") {
      if (!member.kickable) {
        return interaction.reply({
          embeds: [
            errorEmbed("No puedo expulsar a ese miembro.")
          ],
          ephemeral: true
        });
      }

      await member.kick(reason);

      await logAction(
        interaction.guild,
        "admin",
        {
          title: `${E.admin} Kick`,
          description:
            `${interaction.user} expulsó a ${user}.\n\n` +
            `Razón: **${reason}**`,
          color: COLORS.warning
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(`${user.tag} fue expulsado.`)
        ]
      });
    }

    if (command === "mute") {
      const minutes =
        interaction.options.getInteger("minutos");

      if (!member.moderatable) {
        return interaction.reply({
          embeds: [
            errorEmbed("No puedo silenciar a ese miembro.")
          ],
          ephemeral: true
        });
      }

      await member.timeout(
        minutes * 60_000,
        reason
      );

      await logAction(
        interaction.guild,
        "admin",
        {
          title: `${E.admin} Mute`,
          description:
            `${interaction.user} silenció a ${user} durante **${minutes} minutos**.\n\n` +
            `Razón: **${reason}**`,
          color: COLORS.warning
        }
      );

      return interaction.reply({
        embeds: [
          successEmbed(
            `${user.tag} fue silenciado durante **${minutes} minutos**.`
          )
        ]
      });
    }
  }

  if (!canManageSystem(interaction.member)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Necesitas el permiso interno **admin** o Administrador de Discord."
        )
      ],
      ephemeral: true
    });
  }

  if (command === "admin") {
    return showAdmin(interaction, true);
  }

  // ADD MONEY
  if (command === "addmoney") {
    const user =
      interaction.options.getUser("usuario");

    const amount =
      interaction.options.getInteger("cantidad");

    const account = getUser(user.id);

    account.wallet += amount;
    saveData();

    await logAction(
      interaction.guild,
      "economia",
      {
        title: `${E.gain} Dinero añadido`,
        description:
          `${interaction.user} añadió **$${amount.toLocaleString("es-ES")}** a ${user}.\n\n` +
          `Saldo: **$${account.wallet.toLocaleString("es-ES")}**`,
        color: COLORS.success
      }
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `Añadiste **$${amount.toLocaleString("es-ES")}** a ${user}.\n\n` +
          `Nuevo wallet: **$${account.wallet.toLocaleString("es-ES")}**`
        )
      ]
    });
  }

  // REMOVE MONEY
  if (command === "removemoney") {
    const user =
      interaction.options.getUser("usuario");

    const amount =
      interaction.options.getInteger("cantidad");

    const account = getUser(user.id);

    const removed = Math.min(account.wallet, amount);

    account.wallet -= removed;
    saveData();

    await logAction(
      interaction.guild,
      "economia",
      {
        title: `${E.loss} Dinero retirado`,
        description:
          `${interaction.user} quitó **$${removed.toLocaleString("es-ES")}** a ${user}.\n\n` +
          `Saldo: **$${account.wallet.toLocaleString("es-ES")}**`,
        color: COLORS.warning
      }
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `Quitaste **$${removed.toLocaleString("es-ES")}** a ${user}.\n\n` +
          `Nuevo wallet: **$${account.wallet.toLocaleString("es-ES")}**`
        )
      ]
    });
  }

  // PANEL
  if (command === "panel") {
    ensureTicketData();

    const name =
      interaction.options.getString("nombre").trim();

    const key = panelKey(name);

    const questionCount =
      interaction.options.getInteger("preguntas");

    const question1 =
      interaction.options.getString("pregunta1");

    const question2 =
      interaction.options.getString("pregunta2");

    if (questionCount >= 1 && !question1) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Seleccionaste al menos una pregunta, pero falta `pregunta1`."
          )
        ],
        ephemeral: true
      });
    }

    if (questionCount === 2 && !question2) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Seleccionaste dos preguntas, pero falta `pregunta2`."
          )
        ],
        ephemeral: true
      });
    }

    const questions = [];

    if (questionCount >= 1) {
      questions.push(question1);
    }

    if (questionCount >= 2) {
      questions.push(question2);
    }

    data.ticketSystem.panels[key] = {
      key,
      name,
      panelMessage:
        interaction.options.getString("mensaje_panel"),
      emoji:
        interaction.options.getString("emoji"),
      entryMessage:
        interaction.options.getString("mensaje_ingreso"),
      questions
    };

    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Panel **${name}** guardado.\n\n` +
          `${E.info} ID: \`${key}\`\n` +
          `${E.info} Preguntas: **${questions.length}/2**`
        )
      ],
      ephemeral: true
    });
  }

  // TICKET PANEL
  if (command === "ticketpanel") {
    ensureTicketData();

    const channel =
      interaction.options.getChannel("canal");

    const value =
      interaction.options.getString("panel");

    const panel =
      data.ticketSystem.panels[value] ||
      Object.values(data.ticketSystem.panels)
        .find(
          p =>
            p.name.toLowerCase() ===
            value.toLowerCase()
        );

    if (!panel) {
      return interaction.reply({
        embeds: [
          errorEmbed("No encontré ese panel.")
        ],
        ephemeral: true
      });
    }

    const menu =
      new StringSelectMenuBuilder()
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
          .setTitle(`${panel.emoji || "🎫"}  ${panel.name}`)
          .setDescription(panel.panelMessage)
      ],
      components: [
        new ActionRowBuilder()
          .addComponents(menu)
      ]
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `Panel **${panel.name}** enviado en ${channel}.`
        )
      ],
      ephemeral: true
    });
  }

  // STAFF
  if (command === "staff") {
    const role =
      interaction.options.getRole("rol");

    const permission =
      interaction.options.getString("permiso");

    const action =
      interaction.options.getString("accion") || "add";

    data.ticketSystem.staffRoles[role.id] ??= [];

    const list =
      data.ticketSystem.staffRoles[role.id];

    if (action === "add") {
      if (!list.includes(permission)) {
        list.push(permission);
      }
    } else {
      data.ticketSystem.staffRoles[role.id] =
        list.filter(p => p !== permission);
    }

    saveData();

    await syncRoleTicketPermissions(
      interaction.guild,
      role.id
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          action === "add"
            ? `Permiso **${permission}** añadido a ${role}.`
            : `Permiso **${permission}** eliminado de ${role}.`
        )
      ]
    });
  }

  if (command === "valoraciones") {
    const channel =
      interaction.options.getChannel("canal");

    data.ticketSystem.logs.valoraciones = channel.id;
    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Canal de valoraciones configurado en ${channel}.`
        )
      ]
    });
  }

  if (command === "transaccion") {
    const channel =
      interaction.options.getChannel("canal");

    data.ticketSystem.logs.transacciones = channel.id;
    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Canal de transacciones configurado en ${channel}.`
        )
      ]
    });
  }

  if (command === "ticketlogs") {
    const channel =
      interaction.options.getChannel("canal");

    data.ticketSystem.logs.tickets = channel.id;
    saveData();

    return interaction.reply({
      embeds: [
        successEmbed(
          `Logs de tickets configurados en ${channel}.`
        )
      ]
    });
  }
}

// =====================================================
// AUTOCOMPLETE
// =====================================================

async function handleAutocomplete(interaction) {
  if (
    !interaction.isAutocomplete() ||
    interaction.commandName !== "ticketpanel"
  ) {
    return;
  }

  ensureTicketData();

  const focused =
    interaction.options.getFocused().toLowerCase();

  const panels =
    Object.values(data.ticketSystem.panels)
      .filter(
        panel =>
          panel.name.toLowerCase().includes(focused) ||
          panel.key.includes(focused)
      )
      .slice(0, 25);

  await interaction.respond(
    panels.map(panel => ({
      name: panel.name.slice(0, 100),
      value: panel.key
    }))
  ).catch(() => {});
}

// =====================================================
// SELECT MENUS
// =====================================================

async function handleSelect(interaction) {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "lrm_admin_menu") {
    if (!canManageSystem(interaction.member)) {
      return interaction.reply({
        embeds: [
          errorEmbed("No tienes permisos.")
        ],
        ephemeral: true
      });
    }

    const selected = interaction.values[0];

    const sections = {
      administracion:
        `### ${E.admin} Administración\n` +
        "`.admin / /admin`\n" +
        "`.addmoney / /addmoney`\n" +
        "`.removemoney / /removemoney`\n" +
        "`.say`\n" +
        "`.embed`",

      tickets:
        `### Tickets\n` +
        "`.panel / /panel`\n" +
        "`.ticketpanel / /ticketpanel`\n" +
        "`.staff / /staff`\n" +
        "`.valoraciones / /valoraciones`\n" +
        "`.transaccion / /transaccion`\n" +
        "`.ticketlogs / /ticketlogs`",

      economia:
        `### ${E.money} Economía\n` +
        "`.addmoney @usuario cantidad`\n" +
        "`.removemoney @usuario cantidad`",

      mensajes:
        `### Mensajes\n` +
        "`.say mensaje`\n" +
        "`.embed mensaje`",

      tienda:
        `### Tienda\n` +
        "`.shopadd`\n" +
        "`.shopremove`\n" +
        "`.shopedit`\n" +
        "`.shoplist`\n" +
        "`.shopclear`",

      logs:
        `### Logs\n` +
        "`.setlog`\n" +
        "`.logs`\n" +
        "`.valoraciones / /valoraciones`\n" +
        "`.transaccion / /transaccion`\n" +
        "`.ticketlogs / /ticketlogs`"
    };

    return interaction.update({
      embeds: [
        glassEmbed(COLORS.admin)
          .setTitle(`${E.admin}  LRM Studio Admin`)
          .setDescription(
            sections[selected] ||
            "Sección no encontrada."
          )
      ],
      components: [adminMenu()]
    });
  }

  if (interaction.customId.startsWith("ticket_create:")) {
    ensureTicketData();

    const key =
      interaction.customId.split(":")[1];

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

    if (!panel.questions.length) {
      return createTicket(
        interaction,
        panel,
        []
      );
    }

    const modal =
      new ModalBuilder()
        .setCustomId(`ticket_modal:${key}`)
        .setTitle(
          `Ticket • ${panel.name}`.slice(0, 45)
        );

    panel.questions.forEach((question, index) => {
      const input =
        new TextInputBuilder()
          .setCustomId(`answer_${index}`)
          .setLabel(
            question.slice(0, 45)
          )
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000);

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(input)
      );
    });

    return interaction.showModal(modal);
  }
}

// =====================================================
// MODAL
// =====================================================

async function handleModal(interaction) {
  if (!interaction.isModalSubmit()) return;

  if (!interaction.customId.startsWith("ticket_modal:")) {
    return;
  }

  const key =
    interaction.customId.split(":")[1];

  const panel =
    data.ticketSystem.panels[key];

  if (!panel) {
    return interaction.reply({
      embeds: [
        errorEmbed("Este panel ya no existe.")
      ],
      ephemeral: true
    });
  }

  const answers =
    panel.questions.map((question, index) => ({
      question,
      answer:
        interaction.fields.getTextInputValue(
          `answer_${index}`
        )
    }));

  return createTicket(
    interaction,
    panel,
    answers
  );
}

// =====================================================
// BOTONES
// =====================================================

async function handleButtons(interaction) {
  if (!interaction.isButton()) return;

  // CLAIM
  if (interaction.customId.startsWith("ticket_claim:")) {
    const channelId =
      interaction.customId.split(":")[1];

    const ticket =
      data.ticketSystem.openTickets[channelId];

    if (!ticket) {
      return interaction.reply({
        embeds: [
          errorEmbed("Este ticket ya no existe.")
        ],
        ephemeral: true
      });
    }

    if (
      !hasStaffPermission(
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

    await ticketLog(
      interaction.guild,
      `${E.admin}  Ticket reclamado`,
      `${interaction.user} reclamó ${interaction.channel}.`,
      COLORS.info
    );

    return interaction.reply({
      embeds: [
        successEmbed(
          `Ticket reclamado por ${interaction.user}.`
        )
      ]
    });
  }

  // CLOSE
  if (interaction.customId.startsWith("ticket_close:")) {
    const channelId =
      interaction.customId.split(":")[1];

    const ticket =
      data.ticketSystem.openTickets[channelId];

    if (!ticket) {
      return interaction.reply({
        embeds: [
          errorEmbed("Este ticket ya no existe.")
        ],
        ephemeral: true
      });
    }

    const isOwner =
      interaction.user.id === ticket.userId;

    if (
      !isOwner &&
      !hasStaffPermission(
        interaction.member,
        "cerrar_ticket"
      )
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

    return requestTicketClose(
      interaction,
      ticket
    );
  }

  // RATING
  if (interaction.customId.startsWith("ticket_rating:")) {
    const parts =
      interaction.customId.split(":");

    const rating =
      Number(parts[1]);

    const channelId =
      parts[2];

    const ticket =
      data.ticketSystem.openTickets[channelId];

    if (!ticket) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Este ticket ya fue cerrado."
          )
        ],
        ephemeral: true
      });
    }

    if (
      interaction.user.id !==
      ticket.userId
    ) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Solo el creador del ticket puede valorarlo."
          )
        ],
        ephemeral: true
      });
    }

    await ratingLog(
      interaction.guild,
      interaction.user,
      rating,
      ticket
    );

    await ticketLog(
      interaction.guild,
      `${E.loss}  Ticket cerrado`,
      `${interaction.user} valoró el ticket con **${rating}/5**.\n\n` +
      `Canal: **${interaction.channel.name}**`,
      COLORS.warning
    );

    delete data.ticketSystem.openTickets[channelId];
    saveData();

    await interaction.update({
      embeds: [
        glassEmbed(COLORS.warning)
          .setTitle(`${E.success}  Valoración recibida`)
          .setDescription(
            `Gracias por valorar la atención con **${rating}/5**.\n\n` +
            `${E.time} Este ticket se cerrará en **5 segundos**.`
          )
      ],
      components: []
    });

    setTimeout(async () => {
      await interaction.channel
        .delete("Ticket cerrado")
        .catch(() => {});
    }, 5000);

    return;
  }
}

// =====================================================
// PREFIX ADMIN
// =====================================================

async function handlePrefix(message) {
  if (
    message.author.bot ||
    !message.guild ||
    !message.content.startsWith(PREFIX)
  ) {
    return;
  }

  const args =
    message.content
      .slice(PREFIX.length)
      .trim()
      .split(/\s+/);

  const command =
    args.shift()?.toLowerCase();

  if (!command) return;

  const commands = [
    "admin",
    "addmoney",
    "removemoney",
    "say",
    "embed",
    "setlog",
    "logs",
    "shopadd",
    "shopremove",
    "shopedit",
    "shoplist",
    "shopclear",
    "ticketpanel",
    "staff",
    "valoraciones",
    "transaccion",
    "ticketlogs"
  ];

  if (!commands.includes(command)) {
    return;
  }

  if (!canManageSystem(message.member)) {
    return message.reply({
      embeds: [
        errorEmbed(
          "No tienes permisos administrativos."
        )
      ]
    });
  }

  // ADMIN
  if (command === "admin") {
    return showAdmin(message);
  }

  // ADDMONEY
  if (command === "addmoney") {
    const target =
      message.mentions.users.first();

    const amount =
      Number(args[1]);

    if (
      !target ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.addmoney @usuario cantidad`"
          )
        ]
      });
    }

    const account =
      getUser(target.id);

    account.wallet += amount;
    saveData();

    await logAction(
      message.guild,
      "economia",
      {
        title: `${E.gain} Dinero añadido`,
        description:
          `${message.author} añadió **$${amount.toLocaleString("es-ES")}** a ${target}.\n\n` +
          `Nuevo saldo: **$${account.wallet.toLocaleString("es-ES")}**`,
        color: COLORS.success
      }
    );

    return message.reply({
      embeds: [
        successEmbed(
          `Añadiste **$${amount.toLocaleString("es-ES")}** a ${target}.\n\n` +
          `Wallet: **$${account.wallet.toLocaleString("es-ES")}**`
        )
      ]
    });
  }

  // REMOVEMONEY
  if (command === "removemoney") {
    const target =
      message.mentions.users.first();

    const amount =
      Number(args[1]);

    if (
      !target ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.removemoney @usuario cantidad`"
          )
        ]
      });
    }

    const account =
      getUser(target.id);

    const removed =
      Math.min(account.wallet, amount);

    account.wallet -= removed;
    saveData();

    await logAction(
      message.guild,
      "economia",
      {
        title: `${E.loss} Dinero retirado`,
        description:
          `${message.author} quitó **$${removed.toLocaleString("es-ES")}** a ${target}.\n\n` +
          `Nuevo saldo: **$${account.wallet.toLocaleString("es-ES")}**`,
        color: COLORS.warning
      }
    );

    return message.reply({
      embeds: [
        successEmbed(
          `Quitaste **$${removed.toLocaleString("es-ES")}** a ${target}.\n\n` +
          `Wallet: **$${account.wallet.toLocaleString("es-ES")}**`
        )
      ]
    });
  }

  // SAY
  if (command === "say") {
    const text = args.join(" ");

    if (!text) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.say mensaje`"
          )
        ]
      });
    }

    await message.delete().catch(() => {});

    return message.channel.send(text);
  }

  // EMBED
  if (command === "embed") {
    const text = args.join(" ");

    if (!text) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.embed mensaje`"
          )
        ]
      });
    }

    await message.delete().catch(() => {});

    return message.channel.send({
      embeds: [
        glassEmbed(COLORS.primary)
          .setDescription(text)
      ]
    });
  }

  // SETLOG
  if (command === "setlog") {
    const type =
      args[0]?.toLowerCase();

    const channel =
      message.mentions.channels.first();

    const valid = [
      "general",
      "economia",
      "tienda",
      "niveles",
      "admin"
    ];

    if (
      !valid.includes(type) ||
      !channel
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.setlog general/economia/tienda/niveles/admin #canal`"
          )
        ]
      });
    }

    data.settings ??= {};
    data.settings.logs ??= {};

    data.settings.logs[type] =
      channel.id;

    saveData();

    return message.reply({
      embeds: [
        successEmbed(
          `Log **${type}** configurado en ${channel}.`
        )
      ]
    });
  }

  // LOGS
  if (command === "logs") {
    const logs =
      data.settings?.logs || {};

    return message.reply({
      embeds: [
        glassEmbed(COLORS.admin)
          .setTitle(`${E.logs}  Logs`)
          .setDescription(
            `General: ${logs.general ? `<#${logs.general}>` : "No configurado"}\n` +
            `Economía: ${logs.economia ? `<#${logs.economia}>` : "No configurado"}\n` +
            `Tienda: ${logs.tienda ? `<#${logs.tienda}>` : "No configurado"}\n` +
            `Niveles: ${logs.niveles ? `<#${logs.niveles}>` : "No configurado"}\n` +
            `Admin: ${logs.admin ? `<#${logs.admin}>` : "No configurado"}\n\n` +
            `Valoraciones: ${
              data.ticketSystem.logs.valoraciones
                ? `<#${data.ticketSystem.logs.valoraciones}>`
                : "No configurado"
            }\n` +
            `Transacciones: ${
              data.ticketSystem.logs.transacciones
                ? `<#${data.ticketSystem.logs.transacciones}>`
                : "No configurado"
            }\n` +
            `Tickets: ${
              data.ticketSystem.logs.tickets
                ? `<#${data.ticketSystem.logs.tickets}>`
                : "No configurado"
            }`
          )
      ]
    });
  }

  // SHOP ADD
  if (command === "shopadd") {
    const name = args[0];
    const price = Number(args[1]);

    if (
      !name ||
      !Number.isInteger(price) ||
      price <= 0
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.shopadd nombre precio`"
          )
        ]
      });
    }

    if (
      data.shop.some(
        item =>
          item.name.toLowerCase() ===
          name.toLowerCase()
      )
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Ya existe un producto con ese nombre."
          )
        ]
      });
    }

    data.shop.push({
      name,
      price,
      type: "item"
    });

    saveData();

    return message.reply({
      embeds: [
        successEmbed(
          `Producto **${name}** añadido por **$${price.toLocaleString("es-ES")}**.`
        )
      ]
    });
  }

  // SHOP REMOVE
  if (command === "shopremove") {
    const name =
      args.join(" ");

    const index =
      data.shop.findIndex(
        item =>
          item.name.toLowerCase() ===
          name.toLowerCase()
      );

    if (index === -1) {
      return message.reply({
        embeds: [
          errorEmbed(
            "No encontré ese producto."
          )
        ]
      });
    }

    const [removed] =
      data.shop.splice(index, 1);

    saveData();

    return message.reply({
      embeds: [
        successEmbed(
          `Producto **${removed.name}** eliminado.`
        )
      ]
    });
  }

  // SHOP EDIT
  if (command === "shopedit") {
    const name = args[0];
    const price = Number(args[1]);

    if (
      !name ||
      !Number.isInteger(price) ||
      price <= 0
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.shopedit nombre nuevoPrecio`"
          )
        ]
      });
    }

    const product =
      data.shop.find(
        item =>
          item.name.toLowerCase() ===
          name.toLowerCase()
      );

    if (!product) {
      return message.reply({
        embeds: [
          errorEmbed(
            "No encontré ese producto."
          )
        ]
      });
    }

    product.price = price;
    saveData();

    return message.reply({
      embeds: [
        successEmbed(
          `**${product.name}** ahora cuesta **$${price.toLocaleString("es-ES")}**.`
        )
      ]
    });
  }

  // SHOP LIST
  if (command === "shoplist") {
    return message.reply({
      embeds: [
        glassEmbed(COLORS.economy)
          .setTitle(`${E.shop}  Productos`)
          .setDescription(
            data.shop.length
              ? data.shop
                  .map(
                    (item, index) =>
                      `**${index + 1}. ${item.name}** • $${item.price.toLocaleString("es-ES")}`
                  )
                  .join("\n")
              : "La tienda está vacía."
          )
      ]
    });
  }

  // SHOP CLEAR
  if (command === "shopclear") {
    data.shop.length = 0;
    saveData();

    return message.reply({
      embeds: [
        successEmbed(
          "Todos los productos fueron eliminados."
        )
      ]
    });
  }

  // TICKET PANEL PREFIX
  if (command === "ticketpanel") {
    const channel =
      message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.ticketpanel #canal nombre-panel`"
          )
        ]
      });
    }

    const panelName =
      args
        .slice(1)
        .join(" ")
        .trim();

    const panel =
      data.ticketSystem.panels[panelName] ||
      Object.values(
        data.ticketSystem.panels
      ).find(
        p =>
          p.name.toLowerCase() ===
          panelName.toLowerCase()
      );

    if (!panel) {
      return message.reply({
        embeds: [
          errorEmbed(
            "No encontré ese panel."
          )
        ]
      });
    }

    const menu =
      new StringSelectMenuBuilder()
        .setCustomId(
          `ticket_create:${panel.key}`
        )
        .setPlaceholder(
          "Selecciona para crear un ticket"
        )
        .addOptions({
          label: panel.name.slice(0, 100),
          value: "create",
          description: "Abrir un nuevo ticket",
          emoji: parseMenuEmoji(panel.emoji)
        });

    await channel.send({
      embeds: [
        glassEmbed(COLORS.primary)
          .setTitle(
            `${panel.emoji || "🎫"}  ${panel.name}`
          )
          .setDescription(
            panel.panelMessage
          )
      ],
      components: [
        new ActionRowBuilder()
          .addComponents(menu)
      ]
    });

    return message.reply({
      embeds: [
        successEmbed(
          `Panel enviado en ${channel}.`
        )
      ]
    });
  }

  // VALORACIONES PREFIX
  if (command === "valoraciones") {
    const channel =
      message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.valoraciones #canal`"
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
          `Valoraciones → ${channel}`
        )
      ]
    });
  }

  // TRANSACCION PREFIX
  if (command === "transaccion") {
    const channel =
      message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.transaccion #canal`"
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
          `Transacciones → ${channel}`
        )
      ]
    });
  }

  // TICKETLOGS PREFIX
  if (command === "ticketlogs") {
    const channel =
      message.mentions.channels.first();

    if (!channel) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.ticketlogs #canal`"
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
          `Logs de tickets → ${channel}`
        )
      ]
    });
  }

  // STAFF PREFIX
  if (command === "staff") {
    const role =
      message.mentions.roles.first();

    const permission =
      args[1]?.toLowerCase();

    const action =
      args[2]?.toLowerCase() || "add";

    const validPermissions = [
      "ver_ticket",
      "cerrar_ticket",
      "reclamar_ticket",
      "gestionar_tickets",
      "ban",
      "mute",
      "kick",
      "admin"
    ];

    if (
      !role ||
      !validPermissions.includes(permission) ||
      !["add", "remove"].includes(action)
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            "Uso: `.staff @rol permiso add/remove`\n\n" +
            `Permisos: \`${validPermissions.join("`, `")}\``
          )
        ]
      });
    }

    data.ticketSystem.staffRoles[role.id] ??= [];

    if (action === "add") {
      if (
        !data.ticketSystem.staffRoles[role.id]
          .includes(permission)
      ) {
        data.ticketSystem.staffRoles[role.id]
          .push(permission);
      }
    } else {
      data.ticketSystem.staffRoles[role.id] =
        data.ticketSystem.staffRoles[role.id]
          .filter(
            p => p !== permission
          );
    }

    saveData();

    await syncRoleTicketPermissions(
      message.guild,
      role.id
    );

    return message.reply({
      embeds: [
        successEmbed(
          action === "add"
            ? `Permiso **${permission}** añadido a ${role}.`
            : `Permiso **${permission}** eliminado de ${role}.`
        )
      ]
    });
  }
}

// =====================================================
// SETUP
// =====================================================

function setupAdmin(discordClient, options) {
  client = discordClient;

  data = options.data;
  saveData = options.saveData;
  sendLog = options.sendLog;
  logAction = options.logAction;
  getUser = options.getUser;

  PREFIX =
    options.prefix || ".";

  COLORS =
    options.colors;

  E =
    options.symbols;

  ensureTicketData();

  if (registered) return;

  registered = true;

  client.on("interactionCreate", async interaction => {
    try {
      if (interaction.isAutocomplete()) {
        return handleAutocomplete(interaction);
      }

      if (interaction.isChatInputCommand()) {
        return handleSlash(interaction);
      }

      if (interaction.isStringSelectMenu()) {
        return handleSelect(interaction);
      }

      if (interaction.isModalSubmit()) {
        return handleModal(interaction);
      }

      if (interaction.isButton()) {
        return handleButtons(interaction);
      }
    } catch (err) {
      console.error(
        "Admin interaction error:",
        err
      );

      if (
        interaction.isRepliable() &&
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          embeds: [
            errorEmbed(
              "Ocurrió un error ejecutando esta acción."
            )
          ],
          ephemeral: true
        }).catch(() => {});
      }
    }
  });

  client.on("messageCreate", async message => {
    try {
      await handlePrefix(message);
    } catch (err) {
      console.error(
        "Admin prefix error:",
        err
      );
    }
  });
}

module.exports = {
  setupAdmin,
  adminCommands
};

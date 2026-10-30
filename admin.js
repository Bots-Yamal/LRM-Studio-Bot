const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require("discord.js");

// =====================================================
// LRM STUDIO
// ADMIN • FLUENT GLASS
// =====================================================

const adminCommands = [];

let client;
let data;
let saveData;
let sendLog;
let logAction;

let PREFIX = ".";

let COLORS = {
  primary: "#7C8CFF",
  success: "#57F287",
  error: "#ED4245",
  warning: "#FEE75C",
  economy: "#63E6BE",
  level: "#C084FC",
  info: "#60A5FA",
  admin: "#A78BFA"
};

let E = {
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
  shop: "▦"
};

let listenersRegistered = false;

// =====================================================
// EMBED
// =====================================================

function glassEmbed(color = COLORS.admin) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({
      text: "LRM Studio  •  Administration"
    });
}

function adminError(text) {
  return glassEmbed(COLORS.error)
    .setTitle(`${E.error}  Acceso denegado`)
    .setDescription(text);
}

// =====================================================
// PERMISOS
// =====================================================

function isAdmin(message) {
  if (!message.member) return false;

  return message.member.permissions.has(
    PermissionFlagsBits.Administrator
  );
}

function interactionIsAdmin(interaction) {
  return interaction.member?.permissions?.has(
    PermissionFlagsBits.Administrator
  );
}

// =====================================================
// LOG
// =====================================================

async function adminLog(
  guild,
  title,
  description,
  color = COLORS.admin,
  user = null
) {
  if (!guild || !logAction) return;

  try {
    await logAction(guild, "admin", {
      title,
      description,
      color,
      user
    });
  } catch (error) {
    console.error(
      "Error enviando admin log:",
      error
    );
  }
}

// =====================================================
// PANEL
// =====================================================

function adminHelpEmbed() {
  return glassEmbed(COLORS.admin)
    .setTitle(`${E.admin}  Administración`)
    .setDescription(
      `### LRM Studio\n` +
      `Panel de configuración del sistema.\n\n` +
      `${E.info}  Selecciona una categoría para continuar.\n\n` +
      `${E.warning}  Solo usuarios con permiso **Administrador** pueden utilizar estas funciones.`
    );
}

function adminMenu() {
  const menu =
    new StringSelectMenuBuilder()
      .setCustomId("lrm_admin_menu")
      .setPlaceholder("Administración")
      .addOptions(
        {
          label: "Administración",
          description: "Información del panel.",
          value: "administracion",
          emoji: "⚙️"
        },
        {
          label: "Mensajes",
          description: "Mensajes y embeds.",
          value: "mensajes",
          emoji: "💬"
        },
        {
          label: "Logs",
          description: "Configuración de registros.",
          value: "logs",
          emoji: "📋"
        },
        {
          label: "Tienda",
          description: "Administrar productos.",
          value: "tienda",
          emoji: "🛍️"
        }
      );

  return new ActionRowBuilder()
    .addComponents(menu);
}

function sendAdminPanel(message) {
  return message.reply({
    embeds: [adminHelpEmbed()],
    components: [adminMenu()]
  });
}

// =====================================================
// INTERACTIONS ADMIN
// =====================================================

async function handleAdminInteraction(interaction) {
  if (!interaction.isStringSelectMenu()) {
    return;
  }

  if (
    interaction.customId !==
    "lrm_admin_menu"
  ) {
    return;
  }

  if (!interactionIsAdmin(interaction)) {
    return interaction.reply({
      embeds: [
        adminError(
          `${E.warning}  Necesitas permisos de **Administrador**.`
        )
      ],
      ephemeral: true
    });
  }

  const category =
    interaction.values[0];

  const embed =
    glassEmbed(COLORS.admin);

  if (category === "administracion") {
    embed
      .setTitle(`${E.admin}  Administración`)
      .setDescription(
        `${E.admin}  **.admin**\n` +
        `Abre este panel.\n\n` +
        `${E.warning}  Todos los comandos de esta sección requieren permiso de **Administrador**.`
      );
  }

  if (category === "mensajes") {
    embed
      .setTitle(`💬  Mensajes`)
      .setDescription(
        `**.say <mensaje>**\n` +
        `Envía un mensaje como el bot.\n\n` +

        `**.embed <color> <mensaje>**\n` +
        `Envía un embed personalizado.\n\n` +

        `Ejemplo\n` +
        `\`.say Hola a todos\`\n\n` +

        `Ejemplo embed\n` +
        `\`.embed #7C8CFF Hola a todos\``
      );
  }

  if (category === "logs") {
    embed
      .setTitle(`${E.logs}  Logs`)
      .setDescription(
        `**.setlog <tipo>**\n` +
        `Configura el canal actual.\n\n` +

        `Tipos disponibles\n` +
        `\`general\`\n` +
        `\`economia\`\n` +
        `\`tienda\`\n` +
        `\`niveles\`\n` +
        `\`admin\`\n\n` +

        `**.logs**\n` +
        `Consulta la configuración actual.`
      );
  }

  if (category === "tienda") {
    embed
      .setColor(COLORS.economy)
      .setTitle(`${E.shop}  Tienda`)
      .setDescription(
        `**.shopadd <nombre> <precio> [tipo] [roleId]**\n` +
        `Añade un producto.\n\n` +

        `**.shopremove <nombre>**\n` +
        `Elimina un producto.\n\n` +

        `**.shopedit <nombre> <nuevoPrecio>**\n` +
        `Cambia su precio.\n\n` +

        `**.shoplist**\n` +
        `Muestra todos los productos.\n\n` +

        `**.shopclear**\n` +
        `Vacía completamente la tienda.`
      );
  }

  return interaction.update({
    embeds: [embed],
    components: [adminMenu()]
  });
}

// =====================================================
// PREFIX ADMIN
// =====================================================

async function handleAdminMessage(message) {
  if (message.author.bot) return;
  if (!message.guild) return;

  if (
    !message.content.startsWith(PREFIX)
  ) {
    return;
  }

  const args =
    message.content
      .slice(PREFIX.length)
      .trim()
      .split(/ +/);

  const command =
    args.shift()?.toLowerCase();

  if (!command) return;

  // ===================================================
  // .ADMIN
  // ===================================================

  if (command === "admin") {
    if (!isAdmin(message)) {
      return message.reply({
        embeds: [
          adminError(
            `${E.warning}  Necesitas el permiso **Administrador** para abrir este panel.`
          )
        ]
      });
    }

    return sendAdminPanel(message);
  }

  const adminCommandsList = [
    "say",
    "embed",
    "setlog",
    "logs",
    "shopadd",
    "shopremove",
    "shopedit",
    "shoplist",
    "shopclear"
  ];

  if (
    !adminCommandsList.includes(command)
  ) {
    return;
  }

  if (!isAdmin(message)) {
    return message.reply({
      embeds: [
        adminError(
          `${E.warning}  No tienes permisos de **Administrador**.`
        )
      ]
    });
  }

  // ===================================================
  // .SAY
  // ===================================================

  if (command === "say") {
    const text = args.join(" ");

    if (!text) {
      return message.reply({
        embeds: [
          glassEmbed(COLORS.warning)
            .setTitle(`${E.warning}  Uso incorrecto`)
            .setDescription(
              `Usa\n\`${PREFIX}say <mensaje>\``
            )
        ]
      });
    }

    try {
      await message.delete().catch(() => {});

      await message.channel.send(text);

      await adminLog(
        message.guild,
        `💬  Mensaje enviado`,
        `${message.author} utilizó **${PREFIX}say**.\n\n` +
        `**Contenido**\n${text}`,
        COLORS.success,
        message.author
      );
    } catch (error) {
      console.error("Error en .say:", error);
    }

    return;
  }

  // ===================================================
  // .EMBED
  // ===================================================

  if (command === "embed") {
    if (args.length < 2) {
      return message.reply({
        embeds: [
          glassEmbed(COLORS.warning)
            .setTitle(`${E.warning}  Uso incorrecto`)
            .setDescription(
              `Usa\n` +
              `\`${PREFIX}embed <color> <mensaje>\`\n\n` +
              `Ejemplo\n` +
              `\`${PREFIX}embed #7C8CFF Hola a todos\``
            )
        ]
      });
    }

    let color = args.shift();

    if (
      !/^#[0-9A-Fa-f]{6}$/.test(color)
    ) {
      color = COLORS.primary;
    }

    const text = args.join(" ");

    const embed =
      new EmbedBuilder()
        .setColor(color)
        .setDescription(text)
        .setTimestamp()
        .setFooter({
          text: "LRM Studio  •  Fluent Glass"
        });

    try {
      await message.delete().catch(() => {});

      await message.channel.send({
        embeds: [embed]
      });

      await adminLog(
        message.guild,
        `${E.info}  Embed enviado`,
        `${message.author} utilizó **${PREFIX}embed**.\n\n` +
        `**Color**\n\`${color}\`\n\n` +
        `**Contenido**\n${text}`,
        COLORS.success,
        message.author
      );
    } catch (error) {
      console.error("Error en .embed:", error);
    }

    return;
  }

  // ===================================================
  // .SETLOG
  // ===================================================

  if (command === "setlog") {
    const type =
      args[0]?.toLowerCase();

    const validTypes = [
      "general",
      "economia",
      "tienda",
      "niveles",
      "admin"
    ];

    if (!validTypes.includes(type)) {
      return message.reply({
        embeds: [
          glassEmbed(COLORS.warning)
            .setTitle(`${E.warning}  Tipo inválido`)
            .setDescription(
              `${E.logs}  Tipos disponibles\n\n` +
              validTypes
                .map(value => `\`${value}\``)
                .join("\n")
            )
        ]
      });
    }

    data.settings ??= {};
    data.settings.logs ??= {};

    data.settings.logs[type] =
      message.channel.id;

    saveData();

    await message.reply({
      embeds: [
        glassEmbed(COLORS.success)
          .setTitle(`${E.success}  Log configurado`)
          .setDescription(
            `${message.channel} ahora recibe los logs de **${type}**.`
          )
      ]
    });

    await adminLog(
      message.guild,
      `${E.logs}  Canal de logs actualizado`,
      `${message.author} configuró ${message.channel} como **${type}**.`,
      COLORS.success,
      message.author
    );

    return;
  }

  // ===================================================
  // .LOGS
  // ===================================================

  if (command === "logs") {
    data.settings ??= {};
    data.settings.logs ??= {};

    const logs = data.settings.logs;

    const getChannel = id => {
      if (!id) {
        return "`No configurado`";
      }

      const channel =
        message.guild.channels.cache.get(id);

      return channel
        ? `${channel}`
        : `\`Canal eliminado • ${id}\``;
    };

    return message.reply({
      embeds: [
        glassEmbed(COLORS.admin)
          .setTitle(`${E.logs}  Configuración de logs`)
          .addFields(
            {
              name: `${E.logs}  General`,
              value: getChannel(logs.general),
              inline: true
            },
            {
              name: `${E.money}  Economía`,
              value: getChannel(logs.economia),
              inline: true
            },
            {
              name: `${E.shop}  Tienda`,
              value: getChannel(logs.tienda),
              inline: true
            },
            {
              name: `${E.level}  Niveles`,
              value: getChannel(logs.niveles),
              inline: true
            },
            {
              name: `${E.admin}  Administración`,
              value: getChannel(logs.admin),
              inline: true
            }
          )
      ]
    });
  }

  // ===================================================
  // .SHOPADD
  // ===================================================

  if (command === "shopadd") {
    if (args.length < 2) {
      return message.reply({
        embeds: [
          glassEmbed(COLORS.warning)
            .setTitle(`${E.warning}  Uso incorrecto`)
            .setDescription(
              `Usa\n` +
              `\`${PREFIX}shopadd <nombre> <precio> [tipo] [roleId]\`\n\n` +
              `Tipos\n` +
              `\`item\`\n` +
              `\`role\``
            )
        ]
      });
    }

    const name = args.shift();
    const price = Number(args.shift());

    const type =
      (args.shift() || "item")
        .toLowerCase();

    const roleId =
      args.shift() || null;

    if (
      !Number.isInteger(price) ||
      price <= 0
    ) {
      return message.reply({
        embeds: [
          adminError(
            `${E.money}  El precio debe ser un entero mayor que 0.`
          )
        ]
      });
    }

    if (
      !["item", "role"].includes(type)
    ) {
      return message.reply({
        embeds: [
          adminError(
            `El tipo debe ser \`item\` o \`role\`.`
          )
        ]
      });
    }

    if (type === "role") {
      if (!roleId) {
        return message.reply({
          embeds: [
            adminError(
              `Debes indicar el ID del rol.`
            )
          ]
        });
      }

      const role =
        message.guild.roles.cache.get(
          roleId
        );

      if (!role) {
        return message.reply({
          embeds: [
            adminError(
              `No encontré ese rol.`
            )
          ]
        });
      }
    }

    const exists =
      data.shop.some(
        product =>
          product.name.toLowerCase() ===
          name.toLowerCase()
      );

    if (exists) {
      return message.reply({
        embeds: [
          adminError(
            `${E.warning}  Ya existe un producto con ese nombre.`
          )
        ]
      });
    }

    data.shop.push({
      name,
      price,
      type,
      roleId:
        type === "role"
          ? roleId
          : null
    });

    saveData();

    await message.reply({
      embeds: [
        glassEmbed(COLORS.success)
          .setTitle(`${E.success}  Producto añadido`)
          .setDescription(
            `### ${name}\n\n` +
            `${E.money}  Precio\n` +
            `**$${price.toLocaleString("es-ES")}**\n\n` +
            `${E.info}  Tipo\n` +
            `**${type}**`
          )
      ]
    });

    await adminLog(
      message.guild,
      `${E.shop}  Producto añadido`,
      `${message.author} añadió **${name}** por **$${price.toLocaleString("es-ES")}**.`,
      COLORS.success,
      message.author
    );

    return;
  }

  // ===================================================
  // .SHOPREMOVE
  // ===================================================

  if (command === "shopremove") {
    const name = args.join(" ");

    if (!name) {
      return message.reply({
        embeds: [
          adminError(
            `Usa\n\`${PREFIX}shopremove <nombre>\``
          )
        ]
      });
    }

    const index =
      data.shop.findIndex(
        product =>
          product.name.toLowerCase() ===
          name.toLowerCase()
      );

    if (index === -1) {
      return message.reply({
        embeds: [
          adminError(
            `No existe ese producto.`
          )
        ]
      });
    }

    const product = data.shop[index];

    data.shop.splice(index, 1);

    saveData();

    await message.reply({
      embeds: [
        glassEmbed(COLORS.success)
          .setTitle(`${E.success}  Producto eliminado`)
          .setDescription(
            `**${product.name}** fue eliminado de la tienda.`
          )
      ]
    });

    await adminLog(
      message.guild,
      `${E.shop}  Producto eliminado`,
      `${message.author} eliminó **${product.name}**.`,
      COLORS.error,
      message.author
    );

    return;
  }

  // ===================================================
  // .SHOPEDIT
  // ===================================================

  if (command === "shopedit") {
    if (args.length < 2) {
      return message.reply({
        embeds: [
          adminError(
            `Usa\n\`${PREFIX}shopedit <nombre> <nuevoPrecio>\``
          )
        ]
      });
    }

    const name = args.shift();
    const newPrice = Number(args.shift());

    if (
      !Number.isInteger(newPrice) ||
      newPrice <= 0
    ) {
      return message.reply({
        embeds: [
          adminError(
            `${E.money}  El nuevo precio no es válido.`
          )
        ]
      });
    }

    const product =
      data.shop.find(
        product =>
          product.name.toLowerCase() ===
          name.toLowerCase()
      );

    if (!product) {
      return message.reply({
        embeds: [
          adminError(
            `No existe ese producto.`
          )
        ]
      });
    }

    const oldPrice = product.price;

    product.price = newPrice;

    saveData();

    await message.reply({
      embeds: [
        glassEmbed(COLORS.success)
          .setTitle(`${E.success}  Producto actualizado`)
          .setDescription(
            `### ${product.name}\n\n` +
            `${E.loss}  Anterior\n` +
            `**$${oldPrice.toLocaleString("es-ES")}**\n\n` +
            `${E.gain}  Nuevo\n` +
            `**$${newPrice.toLocaleString("es-ES")}**`
          )
      ]
    });

    await adminLog(
      message.guild,
      `${E.shop}  Producto editado`,
      `${message.author} cambió **${product.name}** de **$${oldPrice}** a **$${newPrice}**.`,
      COLORS.warning,
      message.author
    );

    return;
  }

  // ===================================================
  // .SHOPLIST
  // ===================================================

  if (command === "shoplist") {
    if (!data.shop.length) {
      return message.reply({
        embeds: [
          glassEmbed(COLORS.warning)
            .setTitle(`${E.shop}  Tienda vacía`)
            .setDescription(
              `No hay productos configurados.`
            )
        ]
      });
    }

    const description =
      data.shop
        .map(
          (product, index) =>
            `**${index + 1}. ${product.name}**\n` +
            `${E.money}  $${product.price.toLocaleString("es-ES")}\n` +
            `${E.info}  ${product.type}` +
            (
              product.type === "role"
                ? `\n${E.level}  <@&${product.roleId}>`
                : ""
            )
        )
        .join("\n\n");

    return message.reply({
      embeds: [
        glassEmbed(COLORS.economy)
          .setTitle(`${E.shop}  Productos`)
          .setDescription(description)
      ]
    });
  }

  // ===================================================
  // .SHOPCLEAR
  // ===================================================

  if (command === "shopclear") {
    if (!data.shop.length) {
      return message.reply({
        embeds: [
          adminError(
            `La tienda ya está vacía.`
          )
        ]
      });
    }

    const amount = data.shop.length;

    data.shop = [];

    saveData();

    await message.reply({
      embeds: [
        glassEmbed(COLORS.success)
          .setTitle(`${E.success}  Tienda limpiada`)
          .setDescription(
            `Se eliminaron **${amount} productos**.`
          )
      ]
    });

    await adminLog(
      message.guild,
      `${E.shop}  Tienda limpiada`,
      `${message.author} eliminó **${amount} productos**.`,
      COLORS.error,
      message.author
    );

    return;
  }
}

// =====================================================
// SETUP
// =====================================================

function setupAdmin(
  discordClient,
  options = {}
) {
  client = discordClient;

  data = options.data;
  saveData = options.saveData;
  sendLog = options.sendLog;
  logAction = options.logAction;

  PREFIX = options.prefix || ".";
  COLORS = options.colors || COLORS;
  E = options.symbols || E;

  // Evita registrar los eventos dos veces.
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  client.on(
    "interactionCreate",
    handleAdminInteraction
  );

  client.on(
    "messageCreate",
    handleAdminMessage
  );
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  setupAdmin,
  adminCommands
};

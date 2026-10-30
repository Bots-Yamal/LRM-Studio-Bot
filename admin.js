const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField
} = require("discord.js");

let client;
let data;
let saveData;
let getEmoji;
let EMOJI_ID;
let sendLog;
let logAction;
let PREFIX = ".";

// =====================================================
// ADMIN SLASH COMMANDS
// =====================================================

// Los comandos administrativos se manejan con prefix.
// Por eso no necesitamos registrar slash commands aquí.
const adminCommands = [];

// =====================================================
// SETUP
// =====================================================

function setupAdmin(
  discordClient,
  options
) {
  client = discordClient;

  data = options.data;
  saveData = options.saveData;

  getEmoji =
    options.getEmoji ||
    (() => "");

  EMOJI_ID =
    options.EMOJI_ID ||
    {};

  sendLog =
    options.sendLog ||
    (async () => {});

  logAction =
    options.logAction ||
    (() => {});

  PREFIX =
    options.prefix ||
    ".";

  client.on(
    "messageCreate",
    handleAdminMessage
  );

  client.on(
    "interactionCreate",
    handleAdminInteraction
  );
}

// =====================================================
// HELPERS
// =====================================================

function E(name) {
  return getEmoji(name);
}

function money(amount) {
  return Number(amount)
    .toLocaleString("es-ES");
}

function errorEmbed(text) {
  return new EmbedBuilder()
    .setColor("#ED4245")
    .setTitle(
      `${E("no")} Ha ocurrido un problema`
    )
    .setDescription(text)
    .setFooter({
      text: "LRM Studio Bot • Admin"
    });
}

function successEmbed(text) {
  return new EmbedBuilder()
    .setColor("#57F287")
    .setTitle(
      `${E("feliz")} Completado`
    )
    .setDescription(text)
    .setFooter({
      text: "LRM Studio Bot • Admin"
    });
}

function isAdmin(message) {
  return message.member?.permissions.has(
    PermissionsBitField.Flags.Administrator
  );
}

// =====================================================
// ADMIN MESSAGE HANDLER
// =====================================================

async function handleAdminMessage(
  message
) {
  if (
    message.author.bot ||
    !message.guild
  ) {
    return;
  }

  if (
    !message.content.startsWith(
      PREFIX
    )
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

  if (!command) {
    return;
  }

  const adminCommandsList = [
    "admin",
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
    !adminCommandsList.includes(
      command
    )
  ) {
    return;
  }

  if (!isAdmin(message)) {
    return message.reply({
      embeds: [
        errorEmbed(
          `${E("no")} Necesitas permisos de **Administrador**.`
        )
      ]
    });
  }

  // =================================================
  // .admin
  // =================================================

  if (
    command === "admin"
  ) {
    const embed =
      new EmbedBuilder()
        .setColor("#FF8A00")
        .setTitle(
          `${E("estrella")} Panel administrativo`
        )
        .setDescription(
          `${E("feliz")} Bienvenido al panel de administración de **LRM Studio Bot**.\n\n` +
          `Selecciona una categoría abajo para consultar las herramientas disponibles.`
        )
        .setFooter({
          text:
            "LRM Studio Bot • Admin"
        });

    const menu =
      new StringSelectMenuBuilder()
        .setCustomId(
          "lrm_admin_menu"
        )
        .setPlaceholder(
          "Selecciona una categoría"
        )
        .addOptions(
          {
            label: "Mensajes",
            description:
              "Enviar mensajes y embeds.",
            value: "mensajes",
            emoji: {
              id:
                EMOJI_ID.idea,
              name: "idea"
            }
          },
          {
            label: "Tienda",
            description:
              "Administrar productos.",
            value: "tienda",
            emoji: {
              id:
                EMOJI_ID.dinero,
              name: "dinero"
            }
          },
          {
            label: "Logs",
            description:
              "Configurar los registros.",
            value: "logs",
            emoji: {
              id:
                EMOJI_ID.ojo,
              name: "emoji_20"
            }
          }
        );

    return message.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder()
          .addComponents(menu)
      ]
    });
  }

  // =================================================
  // .say
  // =================================================

  if (
    command === "say"
  ) {
    const text =
      args.join(" ");

    if (!text) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("idea")} Usa: **.say mensaje**`
          )
        ]
      });
    }

    await message.delete()
      .catch(() => {});

    await message.channel.send(
      text
    );

    logAction(
      message.guild,
      "admin",
      {
        title:
          `${E("idea")} Mensaje enviado`,
        description:
          `${message.author} utilizó **.say** en ${message.channel}.\n\n` +
          `**Contenido:**\n${text}`,
        user:
          message.author
      }
    );

    return;
  }

  // =================================================
  // .embed
  // =================================================

  if (
    command === "embed"
  ) {
    const color =
      args.shift();

    const text =
      args.join(" ");

    if (
      !color ||
      !text
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("idea")} Usa:\n**.embed #FF8A00 mensaje**`
          )
        ]
      });
    }

    if (
      !/^#[0-9A-Fa-f]{6}$/.test(
        color
      )
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("no")} El color debe ser HEX.\nEjemplo: **#FF8A00**`
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
              "LRM Studio Bot"
          })
      ]
    });

    logAction(
      message.guild,
      "admin",
      {
        title:
          `${E("idea")} Embed enviado`,
        description:
          `${message.author} creó un embed en ${message.channel}.\n\n` +
          `**Color:** ${color}\n` +
          `**Contenido:**\n${text}`,
        user:
          message.author
      }
    );

    return;
  }

  // =================================================
  // .setlog
  // =================================================

  if (
    command === "setlog"
  ) {
    const type =
      args.shift()?.toLowerCase();

    const channel =
      message.mentions.channels.first();

    const validTypes = [
      "general",
      "economia",
      "tienda",
      "niveles",
      "admin"
    ];

    if (
      !validTypes.includes(
        type
      )
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("no")} Tipo inválido.\n\n` +
            `Tipos:\n` +
            `\`general\`\n` +
            `\`economia\`\n` +
            `\`tienda\`\n` +
            `\`niveles\`\n` +
            `\`admin\``
          )
        ]
      });
    }

    if (!channel) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("idea")} Debes mencionar el canal.\n\n` +
            `Ejemplo:\n**.setlog general #logs**`
          )
        ]
      });
    }

    data.settings ??= {};
    data.settings.logs ??= {};

    data.settings.logs[type] =
      channel.id;

    saveData();

    logAction(
      message.guild,
      "admin",
      {
        title:
          `${E("estrella")} Log configurado`,
        description:
          `${message.author} configuró el log **${type}** en ${channel}.`,
        user:
          message.author
      }
    );

    return message.reply({
      embeds: [
        successEmbed(
          `${E("feliz")} El log **${type}** ahora se enviará en ${channel}.`
        )
      ]
    });
  }

  // =================================================
  // .logs
  // =================================================

  if (
    command === "logs"
  ) {
    const logs =
      data.settings?.logs || {};

    const channel =
      id =>
        id
          ? `<#${id}>`
          : `${E("triste")} No configurado`;

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF8A00")
          .setTitle(
            `${E("idea")} Configuración de logs`
          )
          .setDescription(
            `${E("estrella")} **General:** ${channel(logs.general)}\n` +
            `${E("dinero")} **Economía:** ${channel(logs.economia)}\n` +
            `${E("dinero")} **Tienda:** ${channel(logs.tienda)}\n` +
            `${E("estrella")} **Niveles:** ${channel(logs.niveles)}\n` +
            `${E("alerta")} **Admin:** ${channel(logs.admin)}`
          )
      ]
    });
  }

  // =================================================
  // .shopadd
  // =================================================

  if (
    command === "shopadd"
  ) {
    const type =
      args.shift()?.toLowerCase();

    const name =
      args.shift();

    const price =
      Number(args.shift());

    const role =
      message.mentions.roles.first();

    if (
      !["role", "item"].includes(
        type
      )
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("idea")} Usa **role** o **item**.`
          )
        ]
      });
    }

    if (
      !name ||
      !Number.isInteger(price) ||
      price < 0
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("idea")} Uso:\n` +
            `**.shopadd item Nombre 1000**\n` +
            `**.shopadd role Nombre 1000 @Rol**`
          )
        ]
      });
    }

    if (
      type === "role" &&
      !role
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("no")} Debes mencionar el rol del producto.`
          )
        ]
      });
    }

    const exists =
      data.shop.some(
        product =>
          product.name
            .toLowerCase() ===
          name.toLowerCase()
      );

    if (exists) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("alerta")} Ya existe un producto con ese nombre.`
          )
        ]
      });
    }

    const product = {
      name,
      price,
      type,
      roleId:
        type === "role"
          ? role.id
          : null
    };

    data.shop.push(
      product
    );

    saveData();

    logAction(
      message.guild,
      "tienda",
      {
        title:
          `${E("dinero")} Producto creado`,
        description:
          `${message.author} creó **${name}**.\n\n` +
          `${E("dinero")} Precio: **${money(price)} monedas**\n` +
          `${E("idea")} Tipo: **${type}**`,
        user:
          message.author
      }
    );

    return message.reply({
      embeds: [
        successEmbed(
          `${E("feliz")} Producto **${name}** añadido a la tienda.`
        )
      ]
    });
  }

  // =================================================
  // .shopremove
  // =================================================

  if (
    command === "shopremove"
  ) {
    const name =
      args.join(" ");

    if (!name) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("idea")} Usa **.shopremove nombre**`
          )
        ]
      });
    }

    const index =
      data.shop.findIndex(
        product =>
          product.name
            .toLowerCase() ===
          name.toLowerCase()
      );

    if (index === -1) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("no")} Ese producto no existe.`
          )
        ]
      });
    }

    const removed =
      data.shop[index];

    data.shop.splice(
      index,
      1
    );

    saveData();

    logAction(
      message.guild,
      "tienda",
      {
        title:
          `${E("no")} Producto eliminado`,
        description:
          `${message.author} eliminó **${removed.name}** de la tienda.\n\n` +
          `${E("dinero")} Precio anterior: **${money(removed.price)} monedas**`,
        color: "#ED4245",
        user:
          message.author
      }
    );

    return message.reply({
      embeds: [
        successEmbed(
          `${E("feliz")} Eliminaste **${removed.name}**.`
        )
      ]
    });
  }

  // =================================================
  // .shopedit
  // =================================================

  if (
    command === "shopedit"
  ) {
    const name =
      args.shift();

    const newPrice =
      Number(args.shift());

    if (
      !name ||
      !Number.isInteger(
        newPrice
      ) ||
      newPrice < 0
    ) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("idea")} Usa **.shopedit nombre precio**`
          )
        ]
      });
    }

    const product =
      data.shop.find(
        item =>
          item.name
            .toLowerCase() ===
          name.toLowerCase()
      );

    if (!product) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("no")} Ese producto no existe.`
          )
        ]
      });
    }

    const oldPrice =
      product.price;

    product.price =
      newPrice;

    saveData();

    logAction(
      message.guild,
      "tienda",
      {
        title:
          `${E("idea")} Producto modificado`,
        description:
          `${message.author} modificó **${product.name}**.\n\n` +
          `${E("dinero")} Precio anterior: **${money(oldPrice)}**\n` +
          `${E("dinero")} Precio nuevo: **${money(newPrice)}**`,
        user:
          message.author
      }
    );

    return message.reply({
      embeds: [
        successEmbed(
          `${E("feliz")} **${product.name}** ahora cuesta **${money(newPrice)} monedas**.`
        )
      ]
    });
  }

  // =================================================
  // .shoplist
  // =================================================

  if (
    command === "shoplist"
  ) {
    if (!data.shop.length) {
      return message.reply({
        embeds: [
          errorEmbed(
            `${E("triste")} La tienda está vacía.`
          )
        ]
      });
    }

    const description =
      data.shop
        .map(
          (product, index) =>
            `${E("estrella")} **${index + 1}. ${product.name}**\n` +
            `${E("dinero")} ${money(product.price)} monedas\n` +
            `${E("idea")} ${product.type}`
        )
        .join("\n\n");

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF8A00")
          .setTitle(
            `${E("dinero")} Productos`
          )
          .setDescription(
            description
          )
      ]
    });
  }

  // =================================================
  // .shopclear
  // =================================================

  if (
    command === "shopclear"
  ) {
    const amount =
      data.shop.length;

    data.shop = [];

    saveData();

    logAction(
      message.guild,
      "tienda",
      {
        title:
          `${E("no")} Tienda limpiada`,
        description:
          `${message.author} eliminó **${amount} productos** de la tienda.`,
        color: "#ED4245",
        user:
          message.author
      }
    );

    return message.reply({
      embeds: [
        successEmbed(
          `${E("feliz")} Se eliminaron **${amount} productos** de la tienda.`
        )
      ]
    });
  }
}

// =====================================================
// ADMIN MENU
// =====================================================

async function handleAdminInteraction(
  interaction
) {
  if (
    !interaction.isStringSelectMenu()
  ) {
    return;
  }

  if (
    interaction.customId !==
    "lrm_admin_menu"
  ) {
    return;
  }

  if (
    !interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    )
  ) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          `${E("no")} No tienes permisos de Administrador.`
        )
      ],
      ephemeral: true
    });
  }

  const category =
    interaction.values[0];

  const embed =
    new EmbedBuilder()
      .setColor("#FF8A00")
      .setFooter({
        text:
          "LRM Studio Bot • Admin"
      });

  if (
    category === "mensajes"
  ) {
    embed
      .setTitle(
        `${E("idea")} Mensajes`
      )
      .setDescription(
        `${E("feliz")} **.say mensaje**\n` +
        `Envía un mensaje como el bot.\n\n` +
        `${E("idea")} **.embed #HEX mensaje**\n` +
        `Envía un embed personalizado.`
      );
  }

  if (
    category === "tienda"
  ) {
    embed
      .setTitle(
        `${E("dinero")} Tienda`
      )
      .setDescription(
        `${E("feliz")} **.shopadd item Nombre precio**\n` +
        `Crea un ítem.\n\n` +
        `${E("estrella")} **.shopadd role Nombre precio @Rol**\n` +
        `Crea un producto de rol.\n\n` +
        `${E("no")} **.shopremove Nombre**\n` +
        `Elimina un producto.\n\n` +
        `${E("idea")} **.shopedit Nombre precio**\n` +
        `Modifica el precio.\n\n` +
        `${E("ojo")} **.shoplist**\n` +
        `Muestra los productos.\n\n` +
        `${E("prohibido")} **.shopclear**\n` +
        `Elimina todos los productos.`
      );
  }

  if (
    category === "logs"
  ) {
    embed
      .setTitle(
        `${E("ojo")} Logs`
      )
      .setDescription(
        `${E("estrella")} **.logs**\n` +
        `Muestra la configuración.\n\n` +
        `${E("idea")} **.setlog general #canal**\n` +
        `Registra prácticamente todas las acciones importantes.\n\n` +
        `${E("dinero")} **.setlog economia #canal**\n` +
        `Registra economía.\n\n` +
        `${E("dinero")} **.setlog tienda #canal**\n` +
        `Registra compras y modificaciones de tienda.\n\n` +
        `${E("estrella")} **.setlog niveles #canal**\n` +
        `Registra subidas de nivel.\n\n` +
        `${E("alerta")} **.setlog admin #canal**\n` +
        `Registra acciones administrativas.`
      );
  }

  return interaction.update({
    embeds: [embed]
  });
}

module.exports = {
  setupAdmin,
  adminCommands
};

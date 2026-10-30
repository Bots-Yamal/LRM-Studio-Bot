const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require("discord.js");

// =====================================================
// LRM STUDIO BOT
// ADMIN.JS
// =====================================================

// Los comandos administrativos se manejan por prefijo.
// No agregamos slash commands administrativos aquí.
const adminCommands = [];

// =====================================================
// VARIABLES
// =====================================================

let client;
let data;
let saveData;
let getEmoji;
let EMOJI_ID;
let sendLog;
let logAction;
let PREFIX = ".";

// =====================================================
// EMOJI
// =====================================================

function E(name) {
  return getEmoji(name);
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
  getEmoji = options.getEmoji;
  EMOJI_ID = options.EMOJI_ID;
  sendLog = options.sendLog;
  logAction = options.logAction;

  PREFIX =
    options.prefix || ".";
}

// =====================================================
// PERMISO ADMIN
// =====================================================

function isAdmin(message) {
  if (!message.member) {
    return false;
  }

  return message.member.permissions.has(
    PermissionFlagsBits.Administrator
  );
}

// =====================================================
// ERROR ADMIN
// =====================================================

function adminError(text) {
  return new EmbedBuilder()
    .setColor("#ED4245")
    .setTitle(
      `${E("no")} Acceso denegado`
    )
    .setDescription(text)
    .setFooter({
      text:
        "LRM Studio Bot • Administración"
    });
}

// =====================================================
// LOG ADMIN
// =====================================================

async function adminLog(
  guild,
  title,
  description,
  color = "#FF8A00",
  user = null
) {
  if (!guild) {
    return;
  }

  try {
    await logAction(
      guild,
      "admin",
      {
        title,
        description,
        color,
        user
      }
    );
  } catch (error) {
    console.error(
      "Error enviando admin log:",
      error
    );
  }
}

// =====================================================
// HELP ADMIN
// =====================================================

function adminHelpEmbed() {
  return new EmbedBuilder()
    .setColor("#FF8A00")
    .setTitle(
      `${E("ojo")} Panel de Administración`
    )
    .setDescription(
      `${E("feliz")} **LRM Studio • Administración**\n\n` +
      `Selecciona una categoría en el menú para consultar los comandos disponibles.\n\n` +
      `${E("prohibido")} Esta sección solamente puede ser utilizada por usuarios con **Administrador**.`
    )
    .setFooter({
      text:
        "LRM Studio Bot • Admin"
    });
}

// =====================================================
// MENÚ ADMIN
// =====================================================

function adminMenu() {
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
          label: "Administración",
          description:
            "Configuración y comandos administrativos.",
          value: "administracion",
          emoji: {
            id: EMOJI_ID.idea,
            name: "idea"
          }
        },
        {
          label: "Mensajes",
          description:
            "Enviar mensajes y embeds.",
          value: "mensajes",
          emoji: {
            id: EMOJI_ID.feliz,
            name: "feliz"
          }
        },
        {
          label: "Logs",
          description:
            "Configura y consulta los logs.",
          value: "logs",
          emoji: {
            id: EMOJI_ID.ojo,
            name: "emoji_20"
          }
        },
        {
          label: "Tienda",
          description:
            "Gestiona los productos de la tienda.",
          value: "tienda",
          emoji: {
            id: EMOJI_ID.dinero,
            name: "dinero"
          }
        }
      );

  return new ActionRowBuilder()
    .addComponents(menu);
}

// =====================================================
// MENSAJE ADMIN
// =====================================================

function sendAdminPanel(message) {
  return message.reply({
    embeds: [
      adminHelpEmbed()
    ],
    components: [
      adminMenu()
    ]
  });
}

// =====================================================
// PANEL DE ADMIN
// =====================================================

client?.on(
  "interactionCreate",
  async interaction => {
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
        PermissionFlagsBits.Administrator
      )
    ) {
      return interaction.reply({
        embeds: [
          adminError(
            `${E("prohibido")} No tienes permisos de **Administrador**.`
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
            "LRM Studio Bot • Administración"
        });

    if (
      category ===
      "administracion"
    ) {
      embed
        .setTitle(
          `${E("idea")} Administración`
        )
        .setDescription(
          `${E("idea")} **.admin** — Abre el panel administrativo.\n\n` +
          `${E("prohibido")} Todos los comandos administrativos requieren permisos de **Administrador**.`
        );
    }

    if (
      category ===
      "mensajes"
    ) {
      embed
        .setTitle(
          `${E("feliz")} Mensajes`
        )
        .setDescription(
          `${E("feliz")} **.say <mensaje>**\n` +
          `Envía un mensaje como el bot.\n\n` +

          `${E("idea")} **.embed <color> <mensaje>**\n` +
          `Envía un mensaje dentro de un embed.\n\n` +

          `${E("estrella")} Ejemplo:\n` +
          `\`.say ${E("feliz")} Hola\`\n\n` +

          `${E("estrella")} Ejemplo embed:\n` +
          `\`.embed #FF8A00 ${E("feliz")} Hola\``
        );
    }

    if (
      category ===
      "logs"
    ) {
      embed
        .setTitle(
          `${E("ojo")} Logs`
        )
        .setDescription(
          `${E("idea")} **.setlog <tipo>**\n` +
          `Configura el canal actual como canal de logs.\n\n` +

          `${E("ojo")} Tipos disponibles:\n` +
          `• \`general\`\n` +
          `• \`economia\`\n` +
          `• \`tienda\`\n` +
          `• \`niveles\`\n` +
          `• \`admin\`\n\n` +

          `${E("estrella")} **.logs**\n` +
          `Consulta los canales configurados.`
        );
    }

    if (
      category ===
      "tienda"
    ) {
      embed
        .setTitle(
          `${E("dinero")} Tienda`
        )
        .setDescription(
          `${E("dinero")} **.shopadd <nombre> <precio> [tipo] [roleId]**\n` +
          `Añade un producto.\n\n` +

          `${E("no")} **.shopremove <nombre>**\n` +
          `Elimina un producto.\n\n` +

          `${E("idea")} **.shopedit <nombre> <nuevoPrecio>**\n` +
          `Edita el precio de un producto.\n\n` +

          `${E("ojo")} **.shoplist**\n` +
          `Muestra todos los productos.\n\n` +

          `${E("prohibido")} **.shopclear**\n` +
          `Elimina todos los productos.`
        );
    }

    await interaction.update({
      embeds: [embed],
      components: [
        adminMenu()
      ]
    });
  }
);

// =====================================================
// PREFIX COMMANDS
// =====================================================

client?.on(
  "messageCreate",
  async message => {
    if (message.author.bot) {
      return;
    }

    if (!message.guild) {
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

    // =================================================
    // .ADMIN
    // =================================================

    if (
      command === "admin"
    ) {
      if (!isAdmin(message)) {
        return message.reply({
          embeds: [
            adminError(
              `${E("prohibido")} Necesitas el permiso **Administrador** para utilizar este panel.`
            )
          ]
        });
      }

      return sendAdminPanel(
        message
      );
    }

    // Los siguientes comandos requieren admin.
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
      adminCommandsList.includes(
        command
      ) &&
      !isAdmin(message)
    ) {
      return message.reply({
        embeds: [
          adminError(
            `${E("prohibido")} No tienes permisos de **Administrador**.`
          )
        ]
      });
    }

    // =================================================
    // .SAY
    // =================================================

    if (
      command === "say"
    ) {
      const text =
        args.join(" ");

      if (!text) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FEE75C")
              .setTitle(
                `${E("idea")} Uso incorrecto`
              )
              .setDescription(
                `Usa:\n\`${PREFIX}say <mensaje>\``
              )
          ]
        });
      }

      try {
        await message.delete()
          .catch(() => {});

        await message.channel.send(
          text
        );

        await adminLog(
          message.guild,
          `${E("feliz")} Mensaje enviado`,
          `${message.author} utilizó **${PREFIX}say**.\n\n` +
          `**Contenido:**\n${text}`,
          "#57F287",
          message.author
        );
      } catch (error) {
        console.error(
          "Error en .say:",
          error
        );
      }

      return;
    }

    // =================================================
    // .EMBED
    // =================================================

    if (
      command === "embed"
    ) {
      if (
        args.length < 2
      ) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FEE75C")
              .setTitle(
                `${E("idea")} Uso incorrecto`
              )
              .setDescription(
                `Usa:\n\`${PREFIX}embed <color> <mensaje>\`\n\n` +
                `Ejemplo:\n\`${PREFIX}embed #FF8A00 ${E("feliz")} Hola\``
              )
          ]
        });
      }

      let color =
        args.shift();

      if (
        !/^#[0-9A-Fa-f]{6}$/.test(
          color
        )
      ) {
        color = "#FF8A00";
      }

      const text =
        args.join(" ");

      const embed =
        new EmbedBuilder()
          .setColor(color)
          .setDescription(text)
          .setTimestamp()
          .setFooter({
            text:
              "LRM Studio Bot"
          });

      try {
        await message.delete()
          .catch(() => {});

        await message.channel.send({
          embeds: [embed]
        });

        await adminLog(
          message.guild,
          `${E("idea")} Embed enviado`,
          `${message.author} utilizó **${PREFIX}embed**.\n\n` +
          `**Color:** \`${color}\`\n` +
          `**Contenido:**\n${text}`,
          "#57F287",
          message.author
        );
      } catch (error) {
        console.error(
          "Error en .embed:",
          error
        );
      }

      return;
    }

    // =================================================
    // .SETLOG
    // =================================================

    if (
      command === "setlog"
    ) {
      const type =
        args[0]?.toLowerCase();

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
            new EmbedBuilder()
              .setColor("#FEE75C")
              .setTitle(
                `${E("idea")} Tipo de log inválido`
              )
              .setDescription(
                `${E("ojo")} Tipos disponibles:\n\n` +
                validTypes
                  .map(
                    value =>
                      `• \`${value}\``
                  )
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
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E("feliz")} Log configurado`
            )
            .setDescription(
              `${E("estrella")} Este canal ahora es el canal de logs de tipo **${type}**.`
            )
        ]
      });

      await adminLog(
        message.guild,
        `${E("idea")} Canal de logs configurado`,
        `${message.author} configuró ${message.channel} como canal de logs **${type}**.`,
        "#57F287",
        message.author
      );

      return;
    }

    // =================================================
    // .LOGS
    // =================================================

    if (
      command === "logs"
    ) {
      data.settings ??= {};
      data.settings.logs ??= {};

      const logs =
        data.settings.logs;

      const getChannel =
        id => {
          if (!id) {
            return "No configurado";
          }

          const channel =
            message.guild.channels.cache.get(
              id
            );

          return channel
            ? `${channel}`
            : `Canal eliminado (${id})`;
        };

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF8A00")
            .setTitle(
              `${E("ojo")} Configuración de Logs`
            )
            .addFields(
              {
                name:
                  `${E("idea")} General`,
                value:
                  getChannel(
                    logs.general
                  ),
                inline: true
              },
              {
                name:
                  `${E("dinero")} Economía`,
                value:
                  getChannel(
                    logs.economia
                  ),
                inline: true
              },
              {
                name:
                  `${E("dinero")} Tienda`,
                value:
                  getChannel(
                    logs.tienda
                  ),
                inline: true
              },
              {
                name:
                  `${E("estrella")} Niveles`,
                value:
                  getChannel(
                    logs.niveles
                  ),
                inline: true
              },
              {
                name:
                  `${E("ojo")} Administración`,
                value:
                  getChannel(
                    logs.admin
                  ),
                inline: true
              }
            )
        ]
      });
    }

    // =================================================
    // .SHOPADD
    // =================================================

    if (
      command === "shopadd"
    ) {
      if (
        args.length < 2
      ) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FEE75C")
              .setTitle(
                `${E("idea")} Uso incorrecto`
              )
              .setDescription(
                `Usa:\n` +
                `\`${PREFIX}shopadd <nombre> <precio> [tipo] [roleId]\`\n\n` +
                `Tipos:\n` +
                `• \`item\`\n` +
                `• \`role\``
              )
          ]
        });
      }

      const name =
        args.shift();

      const price =
        Number(
          args.shift()
        );

      const type =
        (
          args.shift() ||
          "item"
        ).toLowerCase();

      const roleId =
        args.shift() ||
        null;

      if (
        !Number.isInteger(price) ||
        price <= 0
      ) {
        return message.reply({
          embeds: [
            adminError(
              `${E("dinero")} El precio debe ser un número entero mayor que 0.`
            )
          ]
        });
      }

      if (
        ![
          "item",
          "role"
        ].includes(type)
      ) {
        return message.reply({
          embeds: [
            adminError(
              `${E("no")} El tipo debe ser \`item\` o \`role\`.`
            )
          ]
        });
      }

      if (
        type === "role"
      ) {
        if (!roleId) {
          return message.reply({
            embeds: [
              adminError(
                `${E("prohibido")} Para un producto de tipo \`role\` necesitas indicar el ID del rol.`
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
                `${E("no")} No encontré ese rol en el servidor.`
              )
            ]
          });
        }
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
            adminError(
              `${E("alerta")} Ya existe un producto con ese nombre.`
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
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E("dinero")} Producto añadido`
            )
            .setDescription(
              `${E("estrella")} **${name}**\n\n` +
              `${E("dinero")} Precio: **${price.toLocaleString("es-ES")} monedas**\n` +
              `${E("idea")} Tipo: **${type}**`
            )
        ]
      });

      await adminLog(
        message.guild,
        `${E("dinero")} Producto añadido`,
        `${message.author} añadió **${name}** por **${price} monedas**.`,
        "#57F287",
        message.author
      );

      return;
    }

    // =================================================
    // .SHOPREMOVE
    // =================================================

    if (
      command === "shopremove"
    ) {
      const name =
        args.join(" ");

      if (!name) {
        return message.reply({
          embeds: [
            adminError(
              `Usa:\n\`${PREFIX}shopremove <nombre>\``
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
            adminError(
              `${E("no")} No existe ese producto.`
            )
          ]
        });
      }

      const product =
        data.shop[index];

      data.shop.splice(
        index,
        1
      );

      saveData();

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E("feliz")} Producto eliminado`
            )
            .setDescription(
              `${E("no")} Se eliminó **${product.name}** de la tienda.`
            )
        ]
      });

      await adminLog(
        message.guild,
        `${E("no")} Producto eliminado`,
        `${message.author} eliminó **${product.name}** de la tienda.`,
        "#ED4245",
        message.author
      );

      return;
    }

    // =================================================
    // .SHOPEDIT
    // =================================================

    if (
      command === "shopedit"
    ) {
      if (
        args.length < 2
      ) {
        return message.reply({
          embeds: [
            adminError(
              `Usa:\n\`${PREFIX}shopedit <nombre> <nuevoPrecio>\``
            )
          ]
        });
      }

      const name =
        args.shift();

      const newPrice =
        Number(
          args.shift()
        );

      if (
        !Number.isInteger(
          newPrice
        ) ||
        newPrice <= 0
      ) {
        return message.reply({
          embeds: [
            adminError(
              `${E("dinero")} El nuevo precio no es válido.`
            )
          ]
        });
      }

      const product =
        data.shop.find(
          product =>
            product.name
              .toLowerCase() ===
            name.toLowerCase()
        );

      if (!product) {
        return message.reply({
          embeds: [
            adminError(
              `${E("no")} No existe ese producto.`
            )
          ]
        });
      }

      const oldPrice =
        product.price;

      product.price =
        newPrice;

      saveData();

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E("idea")} Producto actualizado`
            )
            .setDescription(
              `${E("estrella")} **${product.name}**\n\n` +
              `${E("dinero")} Precio anterior: **${oldPrice}**\n` +
              `${E("dinero")} Nuevo precio: **${newPrice}**`
            )
        ]
      });

      await adminLog(
        message.guild,
        `${E("idea")} Producto editado`,
        `${message.author} cambió el precio de **${product.name}** de **${oldPrice}** a **${newPrice}**.`,
        "#FEE75C",
        message.author
      );

      return;
    }

    // =================================================
    // .SHOPLIST
    // =================================================

    if (
      command === "shoplist"
    ) {
      if (
        data.shop.length === 0
      ) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FEE75C")
              .setTitle(
                `${E("dinero")} Tienda vacía`
              )
              .setDescription(
                `${E("triste")} No hay productos configurados.`
              )
          ]
        });
      }

      const description =
        data.shop
          .map(
            (product, index) =>
              `${E("estrella")} **${index + 1}. ${product.name}**\n` +
              `${E("dinero")} Precio: **${product.price.toLocaleString("es-ES")} monedas**\n` +
              `${E("idea")} Tipo: **${product.type}**` +
              (
                product.type === "role"
                  ? `\n${E("ojo")} Rol: <@&${product.roleId}>`
                  : ""
              )
          )
          .join("\n\n");

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF8A00")
            .setTitle(
              `${E("dinero")} Lista de productos`
            )
            .setDescription(
              description
            )
        ]
      });
    }

    // =================================================
    // .SHOPCLEAR
    // =================================================

    if (
      command === "shopclear"
    ) {
      if (
        data.shop.length === 0
      ) {
        return message.reply({
          embeds: [
            adminError(
              `${E("triste")} La tienda ya está vacía.`
            )
          ]
        });
      }

      const amount =
        data.shop.length;

      data.shop = [];

      saveData();

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#57F287")
            .setTitle(
              `${E("feliz")} Tienda limpiada`
            )
            .setDescription(
              `${E("no")} Se eliminaron **${amount} productos** de la tienda.`
            )
        ]
      });

      await adminLog(
        message.guild,
        `${E("no")} Tienda limpiada`,
        `${message.author} eliminó **${amount} productos** de la tienda.`,
        "#ED4245",
        message.author
      );

      return;
    }
  }
);

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  setupAdmin,
  adminCommands
};

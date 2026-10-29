const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");

// =====================================================
// LRM STUDIO BOT • ADMINISTRACIÓN
// =====================================================

const E = {
  feliz: "<:feliz:1543374186540568586>",
  triste: "<:llorando:1543373946383114332>",
  alerta: "<:alerta:1563019834495606824>",
  no: "<:no:1543374123714089122>",
  dinero: "<:dinero:1563019819639640266>",
  ojo: "<:emoji_20:1557625884461109348>",
  prohibido: "<:prohibido:1543374036149477428>",
  idea: "<:idea:1543374116176928859>",
  reloj: "<:reloj:1543374030713790515>",
  estrella: "<:estrella:1543374328140144742>"
};

const EMOJI_ID = {
  feliz: "1543374186540568586",
  alerta: "1563019834495606824",
  dinero: "1563019819639640266",
  prohibido: "1543374036149477428",
  idea: "1543374116176928859",
  estrella: "1543374328140144742"
};

function isAdmin(member) {
  return member.permissions.has(
    PermissionFlagsBits.Administrator
  );
}

function errorEmbed(text) {
  return new EmbedBuilder()
    .setColor("#ED4245")
    .setTitle(`${E.prohibido} Acceso denegado`)
    .setDescription(text)
    .setFooter({
      text: "LRM Studio Bot • Administración"
    });
}

// =====================================================
// COMANDOS SLASH ADMINISTRATIVOS
// index.js utilizará esta lista al registrar comandos.
// =====================================================

const adminCommands = [
  new SlashCommandBuilder()
    .setName("shopadd")
    .setDescription("Añade un producto a la tienda.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
    .addStringOption(option =>
      option
        .setName("tipo")
        .setDescription("Tipo de producto.")
        .setRequired(true)
        .addChoices(
          {
            name: "Ítem",
            value: "item"
          },
          {
            name: "Rol",
            value: "role"
          }
        )
    )
    .addStringOption(option =>
      option
        .setName("nombre")
        .setDescription("Nombre del producto.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("precio")
        .setDescription("Precio del producto.")
        .setMinValue(1)
        .setRequired(true)
    )
    .addRoleOption(option =>
      option
        .setName("rol")
        .setDescription("Rol que se entregará.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("shopremove")
    .setDescription("Elimina un producto de la tienda.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
    .addStringOption(option =>
      option
        .setName("producto")
        .setDescription("Nombre del producto.")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("shopedit")
    .setDescription("Modifica el precio de un producto.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
    .addStringOption(option =>
      option
        .setName("producto")
        .setDescription("Nombre del producto.")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("precio")
        .setDescription("Nuevo precio.")
        .setMinValue(1)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("shoplist")
    .setDescription("Consulta los productos configurados.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("shopclear")
    .setDescription("Elimina todos los productos.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
];

// =====================================================
// ACTIVAR ADMIN
// =====================================================

function setupAdmin(client, database) {

  const {
    data,
    saveData
  } = database;

  // ===================================================
  // PREFIX ADMIN
  // ===================================================

  client.on("messageCreate", async message => {

    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(".")) return;

    const args = message.content
      .slice(1)
      .trim()
      .split(/ +/);

    const command =
      args.shift()?.toLowerCase();

    // =================================================
    // .ADMIN
    // =================================================

    if (command === "admin") {

      if (!isAdmin(message.member)) {
        return message.reply({
          embeds: [
            errorEmbed(
              `${E.no} No tienes permisos para abrir este panel.\n\n` +
              `${E.alerta} Necesitas el permiso **Administrador**.`
            )
          ]
        });
      }

      const embed = new EmbedBuilder()
        .setColor("#ED4245")
        .setTitle(
          `${E.alerta} LRM Studio Bot • Administración`
        )
        .setDescription(
          `${E.ojo} Bienvenido al panel administrativo.\n\n` +

          `${E.idea} Desde aquí puedes administrar mensajes y la tienda del bot.\n\n` +

          `${E.prohibido} Este panel está reservado para administradores.`
        )
        .setFooter({
          text: "LRM Studio Bot • Admin"
        });

      const menu = new StringSelectMenuBuilder()
        .setCustomId("lrm_admin_menu")
        .setPlaceholder(
          "Selecciona una categoría"
        )
        .addOptions(
          {
            label: "Mensajes",
            description:
              "Say, embeds y publicaciones.",
            value: "messages",
            emoji: {
              id: EMOJI_ID.idea
            }
          },
          {
            label: "Configuración de tienda",
            description:
              "Administra productos y roles.",
            value: "shop",
            emoji: {
              id: EMOJI_ID.dinero
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
    // .SAY
    // =================================================

    if (command === "say") {

      if (!isAdmin(message.member)) {
        return message.reply({
          embeds: [
            errorEmbed(
              `${E.no} No tienes permiso para utilizar **.say**.`
            )
          ]
        });
      }

      const text = args.join(" ");

      if (!text) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FEE75C")
              .setTitle(
                `${E.alerta} Falta el mensaje`
              )
              .setDescription(
                `${E.idea} Utiliza:\n\n` +
                "`.say <mensaje>`"
              )
          ]
        });
      }

      // Borramos el comando para que solo aparezca
      // el mensaje enviado por el bot.
      await message.delete().catch(() => {});

      return message.channel.send({
        content: text,

        // Permite menciones para administradores.
        allowedMentions: {
          parse: [
            "users",
            "roles",
            "everyone"
          ]
        }
      });
    }

    // =================================================
    // .EMBED
    // =================================================

    if (command === "embed") {

      if (!isAdmin(message.member)) {
        return message.reply({
          embeds: [
            errorEmbed(
              `${E.no} No tienes permiso para utilizar **.embed**.`
            )
          ]
        });
      }

      const color = args.shift();
      const text = args.join(" ");

      if (!color || !text) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FEE75C")
              .setTitle(
                `${E.alerta} Uso incorrecto`
              )
              .setDescription(
                `${E.idea} Utiliza:\n\n` +
                "`.embed #FF8800 Tu mensaje`"
              )
          ]
        });
      }

      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ED4245")
              .setTitle(
                `${E.no} Color inválido`
              )
              .setDescription(
                `Debes utilizar un color HEX.\n\n` +
                `${E.idea} Ejemplo: **#FF8800**`
              )
          ]
        });
      }

      const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(text);

      await message.delete().catch(() => {});

      return message.channel.send({
        embeds: [embed],

        allowedMentions: {
          parse: [
            "users",
            "roles",
            "everyone"
          ]
        }
      });
    }
  });

  // ===================================================
  // INTERACTIONS ADMIN
  // ===================================================

  client.on(
    "interactionCreate",
    async interaction => {

      // ===============================================
      // ADMIN MENU
      // ===============================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          "lrm_admin_menu"
      ) {

        if (!isAdmin(interaction.member)) {
          return interaction.reply({
            embeds: [
              errorEmbed(
                `${E.no} No tienes permiso para utilizar este menú.`
              )
            ],
            ephemeral: true
          });
        }

        const option =
          interaction.values[0];

        if (option === "messages") {

          const embed = new EmbedBuilder()
            .setColor("#ED4245")
            .setTitle(
              `${E.idea} Administración • Mensajes`
            )
            .setDescription(
              `${E.estrella} **.say <mensaje>**\n` +
              `Hace que LRM Studio Bot envíe un mensaje.\n\n` +

              `${E.estrella} **.embed <color> <mensaje>**\n` +
              `Publica un embed personalizado.\n\n` +

              `${E.idea} **Ejemplo**\n` +
              "`.embed #FF8800 Hola @everyone`\n\n" +

              `${E.alerta} Las menciones @everyone y roles están disponibles únicamente para administradores.`
            )
            .setFooter({
              text:
                "LRM Studio Bot • Administración"
            });

          return interaction.update({
            embeds: [embed]
          });
        }

        if (option === "shop") {

          const embed = new EmbedBuilder()
            .setColor("#ED4245")
            .setTitle(
              `${E.dinero} Administración • Tienda`
            )
            .setDescription(
              `${E.feliz} **/shopadd**\n` +
              `Añade un rol o ítem a la tienda.\n\n` +

              `${E.no} **/shopremove**\n` +
              `Elimina un producto.\n\n` +

              `${E.idea} **/shopedit**\n` +
              `Modifica el precio.\n\n` +

              `${E.ojo} **/shoplist**\n` +
              `Muestra todos los productos configurados.\n\n` +

              `${E.alerta} **/shopclear**\n` +
              `Elimina todos los productos.`
            )
            .setFooter({
              text:
                "LRM Studio Bot • Administración"
            });

          return interaction.update({
            embeds: [embed]
          });
        }

        return;
      }

      // ===============================================
      // SLASH ADMIN
      // ===============================================

      if (!interaction.isChatInputCommand()) {
        return;
      }

      const command =
        interaction.commandName;

      const adminCommandNames = [
        "shopadd",
        "shopremove",
        "shopedit",
        "shoplist",
        "shopclear"
      ];

      if (
        !adminCommandNames.includes(command)
      ) {
        return;
      }

      // Doble comprobación.
      if (!isAdmin(interaction.member)) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              `${E.no} No tienes permiso para utilizar **/${command}**.\n\n` +
              `${E.alerta} Necesitas el permiso **Administrador**.`
            )
          ],
          ephemeral: true
        });
      }

      // ===============================================
      // /SHOPADD
      // ===============================================

      if (command === "shopadd") {

        const type =
          interaction.options.getString(
            "tipo"
          );

        const name =
          interaction.options.getString(
            "nombre"
          );

        const price =
          interaction.options.getInteger(
            "precio"
          );

        const role =
          interaction.options.getRole("rol");

        const exists =
          data.shop.some(
            product =>
              product.name.toLowerCase() ===
              name.toLowerCase()
          );

        if (exists) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#ED4245")
                .setTitle(
                  `${E.no} Producto existente`
                )
                .setDescription(
                  `Ya existe un producto llamado **${name}**.`
                )
            ],
            ephemeral: true
          });
        }

        if (
          type === "role" &&
          !role
        ) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#ED4245")
                .setTitle(
                  `${E.no} Falta seleccionar el rol`
                )
                .setDescription(
                  `Seleccionaste **Rol** como tipo de producto.\n\n` +
                  `${E.idea} También debes seleccionar el rol que recibirá el comprador.`
                )
            ],
            ephemeral: true
          });
        }

        data.shop.push({
          name,
          price,
          type,

          roleId:
            type === "role"
              ? role.id
              : null
        });

        saveData();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#57F287")
              .setTitle(
                `${E.feliz} Producto añadido`
              )
              .setDescription(
                `${E.estrella} **${name}**\n\n` +
                `${E.ojo} Tipo: **${
                  type === "role"
                    ? "Rol"
                    : "Ítem"
                }**\n` +
                `${E.dinero} Precio: **${price.toLocaleString(
                  "es-ES"
                )} monedas**`
              )
              .setFooter({
                text:
                  "LRM Studio Bot • Tienda"
              })
          ]
        });
      }

      // ===============================================
      // /SHOPREMOVE
      // ===============================================

      if (command === "shopremove") {

        const name =
          interaction.options.getString(
            "producto"
          );

        const index =
          data.shop.findIndex(
            product =>
              product.name.toLowerCase() ===
              name.toLowerCase()
          );

        if (index === -1) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#ED4245")
                .setTitle(
                  `${E.no} Producto no encontrado`
                )
                .setDescription(
                  `No existe ningún producto llamado **${name}**.`
                )
            ],
            ephemeral: true
          });
        }

        const removed =
          data.shop.splice(index, 1)[0];

        saveData();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#57F287")
              .setTitle(
                `${E.feliz} Producto eliminado`
              )
              .setDescription(
                `${E.no} **${removed.name}** fue eliminado de la tienda.`
              )
          ]
        });
      }

      // ===============================================
      // /SHOPEDIT
      // ===============================================

      if (command === "shopedit") {

        const name =
          interaction.options.getString(
            "producto"
          );

        const newPrice =
          interaction.options.getInteger(
            "precio"
          );

        const product =
          data.shop.find(
            product =>
              product.name.toLowerCase() ===
              name.toLowerCase()
          );

        if (!product) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#ED4245")
                .setTitle(
                  `${E.no} Producto no encontrado`
                )
                .setDescription(
                  `No encontré **${name}** en la tienda.`
                )
            ],
            ephemeral: true
          });
        }

        const oldPrice =
          product.price;

        product.price = newPrice;

        saveData();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#57F287")
              .setTitle(
                `${E.feliz} Producto actualizado`
              )
              .setDescription(
                `${E.estrella} **${product.name}**\n\n` +
                `${E.triste} Precio anterior: **${oldPrice.toLocaleString(
                  "es-ES"
                )}**\n` +
                `${E.dinero} Nuevo precio: **${newPrice.toLocaleString(
                  "es-ES"
                )}**`
              )
          ]
        });
      }

      // ===============================================
      // /SHOPLIST
      // ===============================================

      if (command === "shoplist") {

        if (!data.shop.length) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FEE75C")
                .setTitle(
                  `${E.alerta} Tienda vacía`
                )
                .setDescription(
                  `${E.idea} Todavía no has configurado productos.`
                )
            ],
            ephemeral: true
          });
        }

        const list =
          data.shop
            .map(
              (product, index) =>
                `${E.estrella} **${
                  index + 1
                }. ${product.name}**\n` +
                `${E.ojo} ${
                  product.type ===
                  "role"
                    ? "Rol"
                    : "Ítem"
                }\n` +
                `${E.dinero} **${product.price.toLocaleString(
                  "es-ES"
                )} monedas**`
            )
            .join("\n\n");

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF8A00")
              .setTitle(
                `${E.dinero} Productos configurados`
              )
              .setDescription(list)
              .setFooter({
                text:
                  "LRM Studio Bot • Administración"
              })
          ],
          ephemeral: true
        });
      }

      // ===============================================
      // /SHOPCLEAR
      // ===============================================

      if (command === "shopclear") {

        if (!data.shop.length) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FEE75C")
                .setTitle(
                  `${E.alerta} Tienda vacía`
                )
                .setDescription(
                  `No hay productos para eliminar.`
                )
            ],
            ephemeral: true
          });
        }

        const amount =
          data.shop.length;

        data.shop.length = 0;

        saveData();

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#ED4245")
              .setTitle(
                `${E.alerta} Tienda vaciada`
              )
              .setDescription(
                `${E.no} Se eliminaron **${amount} productos** de la tienda.`
              )
              .setFooter({
                text:
                  "LRM Studio Bot • Administración"
              })
          ]
        });
      }
    }
  );
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  setupAdmin,
  adminCommands
};

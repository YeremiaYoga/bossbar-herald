Hooks.on("ready", () => {});

Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControls = controls.find((control) => control.name === "token");
  if (tokenControls) {
    tokenControls.tools.push({
      name: "hp_bar",
      title: "Show Hp Bar",
      icon: "fas fa-smile",
      visible: true,
      onClick: () => {
        showHpBar();
      },
      button: true,
    });
  }
});

let toggleHpBar = false;
let monitoredTokenId = null;
let setTime = null;
let timerCheckerEffect = 1000;
let currentActor = null;
let showEffects = true;
let showLegact = true;
let showLegres = true;

function showHpBar() {
  const controlledTokens = canvas.tokens.controlled;

  if (controlledTokens.length === 0) {
    ui.notifications.warn("Tidak ada token yang dipilih.");
    return;
  }

  const existingBar = document.getElementById("boss-hp-bar");
  if (existingBar) {
    existingBar.remove();
  }

  const token = controlledTokens[0];
  monitoredTokenId = token.id;
  const actor = token.actor;
  if (!actor) return;
  currentActor = actor;
  createHpBar(actor);
}

function createHpBar(actor) {
  const hp = actor.system.attributes.hp.value;
  const maxHp = actor.system.attributes.hp.max;
  const tempHp = actor.system.attributes.hp.temp || 0;
  const hpPercent = (hp / maxHp) * 100;
  const tempHpPercent = (tempHp / maxHp) * 100;

  fetch("/modules/test-bossbar/templates/hpbar.html")
    .then((response) => response.text())
    .then((html) => {
      const div = document.createElement("div");
      div.innerHTML = html;

      const tokenImage = div.querySelector("#token-image");
      const hpBar = div.querySelector("#hp-bar");
      const bghpBar = div.querySelector("#bghp-bar");
      const tempHpBar = div.querySelector("#temphp-bar");
      const bgtempHpBar = div.querySelector("#bgtemphp-bar");
      const tokenName = div.querySelector("#token-name");

      tokenImage.src = actor.img;
      tokenName.textContent = actor.name;
      tempHpBar.style.width = `${tempHpPercent}%`;
      bgtempHpBar.style.width = `${tempHpPercent}%`;
      hpBar.style.width = `${hpPercent}%`;
      bghpBar.style.width = `${hpPercent}%`;
      div.firstChild.id = "boss-hp-bar";

      document.body.appendChild(div.firstChild);
      updateEffects(actor);
      updateMysticAction(actor);
      displayLegendaryAction(actor);
      displayLegendaryResistance(actor);

      if (setTime == null) {
        playInterval(actor);
      }
    })
    .catch((err) => {
      console.error("Gagal memuat template hpbar.html:", err);
    });
}

function updateMysticAction(actor) {
  const mysticAction = actor.items.find(
    (item) => item.name === "Mystic Action"
  );

  let mysticDiv = document.getElementById("mystic-action");
  mysticDiv.innerHTML = `
  <div>
    <img src="/modules/test-bossbar/assets/mystic_action.webp" class="mystic-action" alt="Mystic Action" />
  </div>
  `;
}

function updateMysticActionUI(imageURL) {
  let mysticDiv = document.getElementById("mystic-action");
  if (mysticDiv) {
    mysticDiv.innerHTML = `
      <div>
        <img src="${imageURL}" class="mystic-action" alt="Mystic Action" />
      </div>
    `;
  }
}

function displayLegendaryAction(actor) {
  const legendaryAction = actor.system.resources.legact || null;

  let legactDiv = document.getElementById("legact-container");

  let legactlist = ``;
  if (showLegact == false) {
    legactDiv.innerHTML = legactlist;
    return;
  }
  if (legendaryAction.max == 0) {
    legactDiv.innerHTML = legactlist;
    return;
  }
  for (let i = 0; i < legendaryAction.max; i++) {
    if (i < legendaryAction.value) {
      legactlist += `
      <div>
        <img src="/modules/test-bossbar/assets/legact_on.webp" class="legact-effect" alt="active" />
      </div>`;
    } else {
      legactlist += `
      <div>
        <img src="/modules/test-bossbar/assets/legact_off.webp" class="legact-effect" alt="off" />
      </div>`;
    }
  }
  console.log(actor.system.resources);
  legactDiv.innerHTML = legactlist;
}

function displayLegendaryResistance(actor) {
  const legendaryResistance = actor.system.resources.legres || null;

  let legresDiv = document.getElementById("legres-container");

  let legreslist = ``;
  if (showLegres == false) {
    legresDiv.innerHTML = legreslist;
    return;
  }
  if (legendaryResistance.max == 0) {
    legresDiv.innerHTML = legreslist;
    return;
  }
  for (let i = 0; i < legendaryResistance.max; i++) {
    if (i < legendaryResistance.value) {
      legreslist += `
      <div>
        <img src="/modules/test-bossbar/assets/legres_on.webp" class="legres-effect" alt="active" />
      </div>`;
    } else {
      legreslist += `
      <div>
        <img src="/modules/test-bossbar/assets/legres_off.webp" class="legres-effect" alt="off" />
      </div>`;
    }
  }
  console.log(actor.system.resources);
  legresDiv.innerHTML = legreslist;
}

function updateEffects(actor) {
  let effectsDiv = document.getElementById("effects-container");
  let effectlist = ``;

  if (showEffects) {
    actor.effects.forEach((effect) => {
      effectlist += `
        <div>
          <img src="${effect.img}" class="token-effect" alt="${effect.name}" />
        </div>`;
    });
    console.log("update effect");
  }

  effectsDiv.innerHTML = effectlist;
}

Hooks.on("updateActor", (actor, data) => {
  if (!monitoredTokenId) return;

  const token = canvas.tokens.get(monitoredTokenId);
  if (!token || token.actor.id !== actor.id) return;

  const hpBar = document
    .getElementById("boss-hp-bar")
    ?.querySelector("#hp-bar");
  const bghpBar = document
    .getElementById("boss-hp-bar")
    ?.querySelector("#bghp-bar");

  const tempHpBar = document
    .getElementById("boss-hp-bar")
    ?.querySelector("#temphp-bar");

  const bgtempHpBar = document
    .getElementById("boss-hp-bar")
    ?.querySelector("#bgtemphp-bar");
  if (hpBar) {
    const hp = actor.system.attributes.hp.value;
    const maxHp = actor.system.attributes.hp.max;
    const hpPercent = (hp / maxHp) * 100;
    hpBar.style.width = `${hpPercent}%`;
    setTimeout(() => {
      if (bghpBar) {
        bghpBar.style.width = `${hpPercent}%`;
      }
    }, 500);
  }

  if (tempHpBar) {
    const tempHp = actor.system.attributes.hp.temp || 0;
    const maxHp = actor.system.attributes.hp.max;
    const tempHpPercent = (tempHp / maxHp) * 100;
    tempHpBar.style.width = `${tempHpPercent}%`;
    setTimeout(() => {
      if (bgtempHpBar) {
        bgtempHpBar.style.width = `${tempHpPercent}%`;
      }
    }, 500);
  }

  updateEffects(actor);
});

function playInterval(actor) {
  clearInterval(setTime);
  setTime = setInterval(() => {
    updateEffects(actor);
    displayLegendaryResistance(actor);
    displayLegendaryAction(actor);
  }, timerCheckerEffect);
}

function updateHpBgSkew(value) {
  const hpBgElements = document.querySelectorAll(".hpbg");
  hpBgElements.forEach((element) => {
    element.style.transform = `skewX(${value})`;
    element.style.webkitTransform = `skewX(${value})`;
    element.style.mozTransform = `skewX(${value})`;
    element.style.msTransform = `skewX(${value})`;
    element.style.oTransform = `skewX(${value})`;
  });
}

function toggleEffectsDisplay(value) {
  showEffects = value;
  updateEffects(currentActor);
}

function toggleLegendaryActionDisplay(value) {
  showLegact = value;
  displayLegendaryAction(currentActor);
}

function toggleLegendaryResistanceDisplay(value) {
  showLegres = value;
  displayLegendaryResistance(currentActor);
}

Hooks.on("init", () => {
  game.settings.register("test-bossbar", "hpBarImage", {
    name: "HP Bar Image",
    hint: "Set the URL HP",
    scope: "world",
    config: true,
    type: String,
    default: "/modules/test-bossbar/assets/hp.webp",
    filePicker: true,
    onChange: (value) => {
      document.querySelectorAll("#hp-bar").forEach((bar) => {
        bar.style.backgroundImage = `url('${value}')`;
      });
    },
  });

  game.settings.register("test-bossbar", "tempHpBarImage", {
    name: "Temp HP Bar Image",
    hint: "Set the URL Temp HP",
    scope: "world",
    config: true,
    type: String,
    default: "/modules/test-bossbar/assets/temporary_hp.webp",
    filePicker: true,
    onChange: (value) => {
      document.querySelectorAll("#temphp-bar").forEach((bar) => {
        bar.style.backgroundImage = `url('${value}')`;
      });
    },
  });
  game.settings.register("test-bossbar", "tokenBoxShadowColor", {
    name: "Glow token Image",
    hint: "Set the glow color for the token image's (e.g., '#ff7f00').",
    scope: "world",
    config: true,
    type: String,
    default: "#ff7f00",
    onChange: (value) => {
      document.querySelectorAll(".token-image").forEach((element) => {
        element.style.boxShadow = `0 0 10px 5px ${value}`;
      });
    },
  });

  game.settings.register("test-bossbar", "leftOrnamentImage", {
    name: "Left Ornament Image",
    hint: "Set the URL for the left ornament image.",
    scope: "world",
    config: true,
    type: String,
    default: "/modules/test-bossbar/assets/ornamen_kiri.png",
    filePicker: true,
    onChange: (value) => {
      document.querySelectorAll(".container").forEach((container) => {
        const leftOrnament = container.querySelector("::before");
        if (leftOrnament) {
          leftOrnament.style.backgroundImage = `url('${value}')`;
        }
      });
    },
  });

  game.settings.register("test-bossbar", "rightOrnamentImage", {
    name: "Right Ornament Image",
    hint: "Set the URL for the right ornament image.",
    scope: "world",
    config: true,
    type: String,
    default: "/modules/test-bossbar/assets/ornamen_kanan.png",
    filePicker: true,
    onChange: (value) => {
      document.querySelectorAll(".container").forEach((container) => {
        const rightOrnament = container.querySelector("::after");
        if (rightOrnament) {
          rightOrnament.style.backgroundImage = `url('${value}')`;
        }
      });
    },
  });

  game.settings.register("test-bossbar", "timerCheckerEffect", {
    name: "Timer Checker Effect",
    hint: "Set the in milliseconds for checking effects",
    scope: "world",
    config: true,
    type: Number,
    default: 1000,
    onChange: (value) => {
      timerCheckerEffect = value;
      if (setTime) clearInterval(setTime);
      if (currentActor) playInterval(currentActor);
    },
  });

  game.settings.register("test-bossbar", "mysticActionImage", {
    name: "Mystic Action Image",
    hint: "Set the URL for the Mystic Action image.",
    scope: "world",
    config: true,
    type: String,
    default: "/modules/test-bossbar/assets/mystic_action.webp",
    filePicker: true,
    onChange: (value) => {
      updateMysticActionUI(value);
    },
  });
  game.settings.register("test-bossbar", "hpbgSkewX", {
    name: "HP Background Skew",
    hint: "Choose the skew angle for the HP background.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "0deg": "Box",
      "-40deg": "Parallelogram",
    },
    default: "-40deg",
    onChange: (value) => {
      updateHpBgSkew(value);
    },
  });
  game.settings.register("test-bossbar", "enableEffects", {
    name: "Enable Effects Display",
    hint: "Toggle the display of active effects",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      toggleEffectsDisplay(value);
    },
  });

  game.settings.register("test-bossbar", "showLegact", {
    name: "Show Legendary Actions",
    hint: "Toggle the display of Legendary Action",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      toggleLegendaryActionDisplay(value);
    },
  });

  game.settings.register("test-bossbar", "showLegres", {
    name: "Show Legendary Resistances",
    hint: "Toggle the display of Legendary Resistances",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: (value) => {
      toggleLegendaryResistanceDisplay(value);
    },
  });
});

// ═══════════════════════════════════════════════════════
// Yer fotoşəkillərinin atribusiyası — AVTOMATİK YARADILIB:
//   node scripts/fetch-place-images.mjs  (əl ilə dəyişmə)
// Mənbə: Wikimedia Commons; lisenziya hər fayl üçün API ilə yoxlanıb.
// CC BY / CC BY-SA müəllif və lisenziyanın göstərilməsini tələb edir —
// şəkil altında (PlacePhoto) və /licenses səhifəsində göstərilir.
// ═══════════════════════════════════════════════════════
export const IMAGE_CREDITS = {
  "masjid-al-haram": {
    "key": "masjid-al-haram",
    "file": "File:Masjidul-HaramAerialView (cropped).jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Masjidul-HaramAerialView_(cropped).jpg",
    "author": "Wurzelgnohm",
    "license": "CC0",
    "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 60
      },
      "1600": {
        "w": 1600,
        "h": 1067,
        "kb": 147
      }
    }
  },
  "masjid-an-nabawi": {
    "key": "masjid-an-nabawi",
    "file": "File:Outsideofmasjedolnabi6.JPG",
    "page": "https://commons.wikimedia.org/wiki/File:Outsideofmasjedolnabi6.JPG",
    "author": "Mardetanha",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 41
      },
      "1600": {
        "w": 1600,
        "h": 1067,
        "kb": 125
      }
    }
  },
  "quba": {
    "key": "quba",
    "file": "File:Quba Mosque Full Picture (2024).jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Quba_Mosque_Full_Picture_(2024).jpg",
    "author": "Kaliper1",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 49
      },
      "1600": {
        "w": 1600,
        "h": 1067,
        "kb": 146
      }
    }
  },
  "al-aqsa": {
    "key": "al-aqsa",
    "file": "File:Jerusalem-2013-Temple Mount-Al-Aqsa Mosque (NE exposure).jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Jerusalem-2013-Temple_Mount-Al-Aqsa_Mosque_(NE_exposure).jpg",
    "author": "Godot13",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 46
      },
      "1600": {
        "w": 1548,
        "h": 1032,
        "kb": 140
      }
    }
  },
  "jabal-an-nur": {
    "key": "jabal-an-nur",
    "file": "File:Jabal al-Nur, Mecca, Saudi Arabia (2).jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Jabal_al-Nur,_Mecca,_Saudi_Arabia_(2).jpg",
    "author": "Richard Mortel",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 28
      },
      "1600": {
        "w": 1600,
        "h": 1067,
        "kb": 100
      }
    }
  },
  "jabal-thawr": {
    "key": "jabal-thawr",
    "file": "File:Jabele thor - panoramio.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Jabele_thor_-_panoramio.jpg",
    "author": "Abdul Razzaq Phulpot…",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 40
      },
      "1600": {
        "w": 1080,
        "h": 720,
        "kb": 79
      }
    }
  },
  "uhud": {
    "key": "uhud",
    "file": "File:Mount Uhud Green.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Mount_Uhud_Green.jpg",
    "author": "Ahmed Abdulbasit (Pakistan)",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 70
      },
      "1600": {
        "w": 1354,
        "h": 903,
        "kb": 144
      }
    }
  },
  "badr": {
    "key": "badr",
    "file": "File:General view of the battlefield and burial ground of Badr, Saudi Arabia, site of the historic battle between the Prophet Muhammad and the Quraysh in 624 (4).jpg",
    "page": "https://commons.wikimedia.org/wiki/File:General_view_of_the_battlefield_and_burial_ground_of_Badr,_Saudi_Arabia,_site_of_the_historic_battle_between_the_Prophet_Muhammad_and_the_Quraysh_in_624_(4).jpg",
    "author": "Richard Mortel",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 89
      },
      "1600": {
        "w": 1146,
        "h": 764,
        "kb": 144
      }
    }
  },
  "mina": {
    "key": "mina",
    "file": "File:Mina Overview.JPG",
    "page": "https://commons.wikimedia.org/wiki/File:Mina_Overview.JPG",
    "author": "Mubeen Rahman",
    "license": "CC BY 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 48
      },
      "1600": {
        "w": 1600,
        "h": 1067,
        "kb": 145
      }
    }
  },
  "al-baqi": {
    "key": "al-baqi",
    "file": "File:Makam Al-Baqi (Umroh Ramadhan 2023)-9.jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Makam_Al-Baqi_(Umroh_Ramadhan_2023)-9.jpg",
    "author": "Indonesiagood",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 90
      },
      "1600": {
        "w": 1054,
        "h": 703,
        "kb": 122
      }
    }
  },
  "taif": {
    "key": "taif",
    "file": "File:Al-Hada mountain road, al-Taif, Saudi Arabia (3).jpg",
    "page": "https://commons.wikimedia.org/wiki/File:Al-Hada_mountain_road,_al-Taif,_Saudi_Arabia_(3).jpg",
    "author": "Richard Mortel",
    "license": "CC BY 2.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
    "sizes": {
      "800": {
        "w": 800,
        "h": 533,
        "kb": 25
      },
      "1600": {
        "w": 1600,
        "h": 1067,
        "kb": 139
      }
    }
  }
}

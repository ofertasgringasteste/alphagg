// ===== CONFIGURAÇÃO DA LOJA =====
const LOJA_CONFIG = {
    nome: "Vanessa Lanches",
    logo: "assets/img/Logo_alphaburguer.jpg",
    banner: "Imagens_produtos/banner_vanessa.jpeg",
    tempoEntrega: "30-45 min",
    taxaEntrega: "R$ 15,00",
    entregaGratis: "Grátis",
    descricao: "Hambúrgueres artesanais feitos com muito carinho",
    avaliacao: 4.9,
    totalAvaliacoes: 939,
    distancia: "2,3 km",
    nivel: "Nível 4 de 5",
    instagram: "https://www.instagram.com/alpha_burgueer?igsh=MXZoODR5dGx4dDl4aA==",
    cores: {
        primaria: "#FF5722", // Cor laranja mais escura para hamburguer
        secundaria: "#FFC107", // Cor amarela para queijo/mostarda
        destaque: "#FFFFFF"
    }
};

// ===== CATEGORIAS DE PRODUTOS =====
const CATEGORIAS_CONFIG = [
    {
        id: 'comboMilkshakeGratis',
        nome: '🎁 Combo com Milkshake Grátis',
        ativo: true,
        destaque: true
    },
    {
        id: 'maisVendidos',
        nome: '🥇 MAIS VENDIDOS DO ALPHA',
        ativo: true,
        destaque: true
    },
    {
        id: 'combosDesconto',
        nome: '🍔🍟🍹 Combo Queridinhos do Alpha',
        ativo: true
    },
    {
        id: 'hamburgueresTradicinais',
        nome: '👴 HAMBÚRGUERES TRADICIONAIS 👴',
        ativo: true
    },
    {
        id: 'hamburgueresEspeciais',
        nome: '✨ HAMBÚRGUERES ESPECIAIS ✨',
        ativo: true
    },
    {
        id: 'comboCompartilhar',
        nome: '🙌 COMBO PRA COMPARTILHAR 🙌',
        ativo: true
    },
    {
        id: 'especialesDoMes',
        nome: '🌟🌟 ESPECIAIS DO MÊS 🌟🌟',
        ativo: true
    },
    {
        id: 'vegetarianos',
        nome: '🌿 VEGETARIANOS 🌿',
        ativo: true
    },
    {
        id: 'milkshakes',
        nome: '🍧 MILKSHAKES 🍧',
        ativo: true
    },
    {
        id: 'acompanhamentos',
        nome: '🍟 ACOMPANHAMENTOS 🍟',
        ativo: true
    },
    {
        id: 'bebidas',
        nome: '🍹 BEBIDAS 🍹',
        ativo: true
    },
    {
        id: 'avulsos',
        nome: '📝 Avulsos',
        ativo: true
    }
];

// ===== PRODUTOS REAIS =====
const PRODUTOS_CONFIG = {
    // COMBO COM MILKSHAKE GRÁTIS
    comboMilkshakeGratis: [
        {
            id: 'combo-x-tudo-costela-milkshake',
            nome: 'Combo X-Tudo Costela completo + 1 milkshake grátis',
            categoria: 'combo-milkshake',
            precoOriginal: 53.90,
            precoPromocional: 32.34,
            imagem: 'Imagens_produtos/Combo_X_Tudo_Costela_completo_1_milkshake_grátis.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'O tradicional X-tudo costela + batata + bebida 350mL + milkshake ovomaltine 300ml GRÁTIS'
        },
        {
            id: 'combo-cheese-bacon-milkshake',
            nome: 'Combo: Cheese-Bacon Completo + 1 Milkshake GRÁTIS',
            categoria: 'combo-milkshake',
            precoOriginal: 49.90,
            precoPromocional: 29.94,
            imagem: 'Imagens_produtos/Combo_Cheese_Bacon_Completo_1_Milkshake_GRÁTIS.jpg',
            disponivel: true,
            destaque: true,
            descricao: '1 cheese bacon costela + batata frita + refri 350mL + milkshake ovomaltine 300mL grátis'
        }
    ],

    // MAIS VENDIDOS
    maisVendidos: [
        {
            id: 'x-tudo-mais-vendido',
            nome: 'X-Tudo',
            categoria: 'mais-vendidos',
            precoOriginal: 26.80,
            precoPromocional: 16.08,
            imagem: 'Imagens_produtos/X_Tudo.jpg',
            disponivel: true,
            maisVendido: true,
            descricao: 'Pão leve e crocante, carne (escolha sua preferida), batata palha, maionese, ovo, mussarela, presunto, cheddar, bacon, alface e tomate fresco'
        },
        {
            id: 'x-bacon-mais-vendido',
            nome: 'X-Bacon',
            categoria: 'mais-vendidos',
            precoOriginal: 24.50,
            precoPromocional: 14.70,
            imagem: 'Imagens_produtos/x_bacon.jpg',
            disponivel: true,
            maisVendido: true,
            descricao: 'Pão levemente torrado, carne (sua preferência), batata palha, maionese, mussarela, presunto e bacon'
        },
        {
            id: 'duplo-australiano-mais-vendido',
            nome: 'Duplo Australiano',
            categoria: 'mais-vendidos',
            precoOriginal: 25.80,
            precoPromocional: 15.48,
            imagem: 'Imagens_produtos/duplo_australiano.jpg',
            disponivel: true,
            maisVendido: true,
            descricao: 'Pão australiano, dois burgers artesanais (100g cada) e duas fatias de cheddar'
        },
        {
            id: 'egg-x-bacon-mais-vendido',
            nome: 'Egg-X-Bacon',
            categoria: 'mais-vendidos',
            precoOriginal: 25.90,
            precoPromocional: 15.54,
            imagem: 'Imagens_produtos/Egg_X_Bacon.jpg',
            disponivel: true,
            maisVendido: true,
            descricao: 'Pão selado na chapa, carne suculenta, batata palha, maionese, ovo, mussarela, presunto e bacon'
        },
    ],

    // COMBOS COM DESCONTO
    combosDesconto: [
        {
            id: 'combo-x-tudo',
            nome: 'Combo X-Tudo',
            categoria: 'combos',
            precoOriginal: 48.90,
            precoPromocional: 29.34,
            imagem: 'Imagens_produtos/Combo_X_Tudo.jpg',
            disponivel: true,
            descricao: 'X-tudo costela + batata + bebida 350mL'
        },
        {
            id: 'combo-kids',
            nome: 'Combo Kids',
            categoria: 'combos',
            precoOriginal: 37.90,
            precoPromocional: 22.74,
            imagem: 'Imagens_produtos/Combo_Kids.jpg',
            disponivel: true,
            descricao: '1 Kids burger carne comercial + batata simples + coca lata'
        },
        {
            id: 'combo-davanessa',
            nome: 'Combo Alpha Especial',
            categoria: 'combos',
            precoOriginal: 48.90,
            precoPromocional: 29.34,
            imagem: 'Imagens_produtos/Combo_DaVanessa.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Especial da casa + batata + refrigerante'
        },
        {
            id: 'combo-misterio',
            nome: 'Combo Mistério',
            categoria: 'combos',
            precoOriginal: 52.90,
            precoPromocional: 31.74,
            imagem: 'Imagens_produtos/combo_mistério.jpg',
            disponivel: true,
            descricao: 'Especial Mistério + batata + bebida'
        },
        {
            id: 'combo-x-bacon',
            nome: 'Combo X-Bacon',
            categoria: 'combos',
            precoOriginal: 44.90,
            precoPromocional: 26.94,
            imagem: 'Imagens_produtos/Combo_X_Bacon.jpg',
            disponivel: true,
            descricao: 'X-bacon costela + batata + bebida 350mL'
        },
        {
            id: 'combo-montanha',
            nome: 'Combo Montanha',
            categoria: 'combos',
            precoOriginal: 53.90,
            precoPromocional: 32.34,
            imagem: 'Imagens_produtos/Combo_Montanha.jpg',
            disponivel: true,
            descricao: 'Especial Montanha + batata + bebida'
        }
    ],

    // HAMBURGUERES TRADICIONAIS
    hamburgueresTradicinais: [
        {
            id: 'x-tudo-tradicional',
            nome: 'X-Tudo',
            categoria: 'tradicionais',
            precoOriginal: 26.90,
            precoPromocional: 16.14,
            imagem: 'Imagens_produtos/X_Tudo.jpg',
            disponivel: true,
            descricao: 'Pão leve e crocante, carne (escolha sua preferida), batata palha, maionese, ovo, mussarela, presunto, cheddar, bacon, alface e tomate fresco'
        },
        {
            id: 'x-bacon-tradicional',
            nome: 'X-Bacon',
            categoria: 'tradicionais',
            precoOriginal: 24.50,
            precoPromocional: 14.70,
            imagem: 'Imagens_produtos/x_bacon.jpg',
            disponivel: true,
            descricao: 'Pão levemente torrado, carne (sua preferência), batata palha, maionese, mussarela, presunto e bacon'
        },
        {
            id: 'x-salada',
            nome: 'X-Salada',
            categoria: 'tradicionais',
            precoOriginal: 24.50,
            precoPromocional: 14.70,
            imagem: 'Imagens_produtos/X_Salada.jpg',
            disponivel: true,
            descricao: 'Pão levemente torrado, carne suculenta, batata palha, mussarela, presunto, alface crocante e tomate fresquinho'
        },
        {
            id: 'x-burguer',
            nome: 'X-Burguer',
            categoria: 'tradicionais',
            precoOriginal: 21.90,
            precoPromocional: 13.14,
            imagem: 'Imagens_produtos/X_Burguer.jpg',
            disponivel: true,
            descricao: 'Pão levemente torrado, carne suculenta, batata palha, maionese, mussarela e presunto'
        },
        {
            id: 'egg-x-salada',
            nome: 'Egg-X-Salada',
            categoria: 'tradicionais',
            precoOriginal: 25.90,
            precoPromocional: 15.54,
            imagem: 'Imagens_produtos/Egg_X_Salada.jpg',
            disponivel: true,
            descricao: 'Pão torrado, carne suculenta, batata palha, maionese, ovo, queijo, presunto, alface fresca e tomate maduro'
        },
        {
            id: 'egg-x-bacon-tradicional',
            nome: 'Egg-X-Bacon',
            categoria: 'tradicionais',
            precoOriginal: 25.90,
            precoPromocional: 15.54,
            imagem: 'Imagens_produtos/Egg_X_Bacon.jpg',
            disponivel: true,
            descricao: 'Pão tostado, carne suculenta, batata palha, maionese, ovo frito, mussarela, presunto e bacon'
        },
        {
            id: 'hamburguer-simples',
            nome: 'Hamburguer Simples',
            categoria: 'tradicionais',
            precoOriginal: 19.90,
            precoPromocional: 11.94,
            imagem: 'Imagens_produtos/Hamburguer_Simples.jpg',
            disponivel: true,
            descricao: 'Pão crocante, carne suculenta, batata palha crocante e maionese cremosa'
        },
        {
            id: 'kids-burguer',
            nome: 'Kids Burguer',
            categoria: 'tradicionais',
            precoOriginal: 18.80,
            precoPromocional: 11.28,
            imagem: 'Imagens_produtos/Kids_burguer.jpg',
            disponivel: true,
            descricao: 'Pão tostado, carne suculenta e mussarela derretida'
        }
    ],

    // HAMBÚRGUERES ESPECIAIS
    hamburgueresEspeciais: [
        {
            id: 'davanessa',
            nome: 'Alpha Especial',
            categoria: 'especiais',
            precoOriginal: 32.90,
            precoPromocional: 19.74,
            imagem: 'Imagens_produtos/Da\'Vanessa.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Pão australiano com toque de mel, geleia de bacon exclusiva, dois burgers artesanais, cheddar duplo, cebola caramelizada e Supreme Bacon'
        },
        {
            id: 'misterio-burguer',
            nome: 'Mistério Burguer',
            categoria: 'especiais',
            precoOriginal: 38.90,
            precoPromocional: 23.34,
            imagem: 'Imagens_produtos/Misterio_Burguer.jpeg',
            disponivel: true,
            destaque: true,
            descricao: 'Feito com 3 burgers de costela, cheddar, mussarela e cream cheese, farofa de bacon e baconese em pão especial com gergelim'
        },
        {
            id: 'chocoburguer',
            nome: 'Chocoburguer',
            categoria: 'especiais',
            precoOriginal: 23.90,
            precoPromocional: 14.34,
            imagem: 'Imagens_produtos/Chocoburguer.jpg',
            disponivel: true,
            descricao: 'Sobremesa! Pão de chocolate recheado com Nutella e finalizado com morangos em calda'
        },
        {
            id: 'da-elaine',
            nome: 'Da\'Elaine',
            categoria: 'especiais',
            precoOriginal: 36.90,
            precoPromocional: 22.14,
            imagem: 'Imagens_produtos/Da\'Elaine.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Pão chapeado e selado com três burgers de costela, cheddar Polenghi e fatias de bacon supreme'
        },
        {
            id: 'da-ana',
            nome: 'Da\'Ana',
            categoria: 'especiais',
            precoOriginal: 37.90,
            precoPromocional: 22.74,
            imagem: 'Imagens_produtos/Da\'Ana.jpg',
            disponivel: true,
            descricao: 'Duplo hambúrguer de costela com duplo cheddar, salada de rúcula fresca, tomate, cebola roxa e molho especial em pão com gergelim'
        },
        {
            id: 'montanha',
            nome: 'Montanha',
            categoria: 'especiais',
            precoOriginal: 40.90,
            precoPromocional: 24.54,
            imagem: 'Imagens_produtos/Montanha.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Pão com gergelim, molho SUPERespecial, 4 burgers de costela, cheddar e discos crocantes de parmesão'
        },
        {
            id: 'd-on-fries',
            nome: 'D\'OnFries',
            categoria: 'especiais',
            precoOriginal: 57.90,
            precoPromocional: 34.74,
            imagem: 'Imagens_produtos/D\'OnFries.jpg',
            disponivel: true,
            descricao: 'Hambúrguer artesanal no pão de gergelim com dois burgers de costela, duplo bacon crocante, cheddar polengui, anéis de cebola e fritas cobertas com farofa de bacon, tudo no molho cheddar artesanal'
        },
        {
            id: 'combo-d-on-fries',
            nome: 'Combo D\'OnFries + 1 Batata +1 Refri',
            categoria: 'especiais',
            precoOriginal: 73.00,
            precoPromocional: 43.80,
            imagem: 'Imagens_produtos/D\'OnFries.jpg',
            disponivel: true,
            descricao: 'D\'OnFries + batata + coca-cola lata 350mL + sachês de ketchup, molho verde e molho bacon'
        },
        {
            id: 'duplo-australiano-especial',
            nome: 'Duplo Australiano',
            categoria: 'especiais',
            precoOriginal: 29.90,
            precoPromocional: 17.94,
            imagem: 'Imagens_produtos/duplo_australiano.jpg',
            disponivel: false, // Esgotado
            descricao: 'Pão australiano fresquinho, dois burgers artesanais (80g cada) e duas fatias de cheddar derretido'
        }
    ],

    // COMBO PRA COMPARTILHAR
    comboCompartilhar: [
        {
            id: 'rodizio-em-casa',
            nome: '"Rodízio" em casa',
            categoria: 'combo-compartilhar',
            precoOriginal: 99.90,
            precoPromocional: 59.94,
            imagem: 'Imagens_produtos/rodizio_em_casa.jpg',
            disponivel: true,
            destaque: true,
            descricao: '8 mini hamburgers com pão brioche, carne artesanal e cheddar. Acompanha batatas fritas com cheddar e farofa de bacon, anéis de cebola, almofadinha de queijo gouda e dadinhos de tapioca. Molhos bacon e verde'
        },
        {
            id: 'combo-casal-xt',
            nome: 'Combo Casal XT - Completo (15% de desconto)',
            categoria: 'combo-compartilhar',
            precoOriginal: 85.90,
            precoPromocional: 51.54,
            imagem: 'Imagens_produtos/Combo_Casal_XT_Completo.jpg',
            disponivel: true,
            descricao: '2 X-tudos de costela + porção de batatas com cheddar e bacon + Guaraná Antártica 1L'
        },
        {
            id: 'combo-familia-xt',
            nome: 'Combo Família XT - Completo',
            categoria: 'combo-compartilhar',
            precoOriginal: 184.00,
            precoPromocional: 110.40,
            imagem: 'Imagens_produtos/Combo_familia_XT_Completo.jpg',
            disponivel: true,
            descricao: '4 X-tudo de costela + 2 batatas completas + 2 refrigerantes Guaraná Antárctica 1L'
        }
    ],

    // ESPECIAIS DO MÊS
    especialesDoMes: [
        {
            id: 'double-sweet',
            nome: 'Double Sweet',
            categoria: 'especiais-mes',
            precoOriginal: 35.90,
            precoPromocional: 21.54,
            imagem: 'Imagens_produtos/DoubleSweet.jpeg',
            disponivel: true,
            destaque: true,
            descricao: 'Duas carnes de costela da casa, cheddar Polenghi cremoso, bacon defumado crocante e molho agridoce especial em pão brioche macio'
        },
        {
            id: 'combo-double-sweet',
            nome: 'Combo: Double Sweet + fritas + refri',
            categoria: 'especiais-mes',
            precoOriginal: 47.80,
            precoPromocional: 28.68,
            imagem: 'Imagens_produtos/Combo_Double_Sweet_fritas_refri.jpeg',
            disponivel: true,
            descricao: 'Double Sweet + fritas + coca-cola 350ml'
        }
    ],

    // VEGETARIANOS
    vegetarianos: [
        {
            id: 'veg-burguer',
            nome: 'VegBurguer',
            categoria: 'vegetarianos',
            precoOriginal: 30.90,
            precoPromocional: 18.54,
            imagem: 'Imagens_produtos/VegBurguer.jpg',
            disponivel: true,
            descricao: 'Pão crocante, carne vegetal suculenta, maionese, batata palha, queijo derretido, ovo, alface fresquinha e tomate suculento'
        },
        {
            id: 'veg-cheddar',
            nome: 'VegCheddar',
            categoria: 'vegetarianos',
            precoOriginal: 28.90,
            precoPromocional: 17.34,
            imagem: 'Imagens_produtos/VegCheddar.jpg',
            disponivel: true,
            descricao: 'Pão australiano, burger vegetariano, molho de cheddar e cebola caramelizada'
        }
    ],

    // MILKSHAKES
    milkshakes: [
        {
            id: 'milkshake-morango',
            nome: 'Milkshake - Morango',
            categoria: 'milkshakes',
            precoOriginal: 19.50,
            precoPromocional: 11.70,
            imagem: 'Imagens_produtos/Milkshake_morango.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Cremoso milkshake de morango - 500mL de pura felicidade!'
        },
        {
            id: 'milkshake-ovomaltine',
            nome: 'Milkshake - Ovomaltine',
            categoria: 'milkshakes',
            precoOriginal: 20.50,
            precoPromocional: 12.30,
            imagem: 'Imagens_produtos/Milkshake_ovomaltine.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Sabor clássico com textura cremosa - creme americano autêntico - 500mL'
        },
        {
            id: 'milkshake-ninho-nutella',
            nome: 'Milkshake - Ninho com Nutella',
            categoria: 'milkshakes',
            precoOriginal: 22.90,
            precoPromocional: 13.74,
            imagem: 'Imagens_produtos/Milkshake_ninhocomnutella.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Junção irresistível de sabores clássicos - 500mL'
        }
    ],

    // ACOMPANHAMENTOS
    acompanhamentos: [
        {
            id: 'aneis-cebola',
            nome: 'Anéis de Cebola',
            categoria: 'acompanhamentos',
            precoOriginal: 22.50,
            precoPromocional: 13.50,
            imagem: 'Imagens_produtos/porcoes_aneis_de_cebola.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Porção com 8 unidades empanadas. Acompanha ketchup'
        },
        {
            id: 'batata-frita-simples',
            nome: 'Batata Frita Simples',
            categoria: 'acompanhamentos',
            precoOriginal: 15.90,
            precoPromocional: 9.54,
            imagem: 'Imagens_produtos/Batata_Frita_Simples.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Super porção de 200gr'
        },
        {
            id: 'batata-frita-cheddar-bacon',
            nome: 'Batata Frita + Cheddar + Bacon',
            categoria: 'acompanhamentos',
            precoOriginal: 22.50,
            precoPromocional: 13.50,
            imagem: 'Imagens_produtos/Batata_Frita_Cheddar_Bacon.jpg',
            disponivel: true,
            descricao: 'Super porção de 200gr + cheddar + bacon. Acompanha ketchup'
        },
        {
            id: 'batata-frita-cheddar',
            nome: 'Batata Frita (200gr) + Cheddar',
            categoria: 'acompanhamentos',
            precoOriginal: 20.50,
            precoPromocional: 12.30,
            imagem: 'Imagens_produtos/Batata Frita_200g_Cheddar.jpg',
            disponivel: true,
            descricao: 'Super porção de 200gr + cheddar. Acompanha ketchup'
        },
        {
            id: 'batata-frita-bacon',
            nome: 'Batata Frita + Bacon',
            categoria: 'acompanhamentos',
            precoOriginal: 20.50,
            precoPromocional: 12.30,
            imagem: 'Imagens_produtos/Batata_Frita_Bacon.jpg',
            disponivel: true,
            descricao: 'Super porção de 200gr + bacon. Acompanha ketchup'
        },
        {
            id: 'almofadinha-queijo-gouda',
            nome: 'Almofadinha de Queijo Gouda',
            categoria: 'acompanhamentos',
            precoOriginal: 25.50,
            precoPromocional: 15.30,
            imagem: 'Imagens_produtos/Almofadinha_de_Queijo_Gouda.jpg',
            disponivel: true,
            destaque: true,
            descricao: 'Porção com 8 unidades fritas e crocantes'
        }
    ],

    // BEBIDAS
    bebidas: [
        // Refrigerantes 2L
        {
            id: 'guarana-antarctica-2l',
            nome: 'Guaraná Antartica 2,0L',
            categoria: 'bebidas',
            precoOriginal: 15.00,
            precoPromocional: 9.00,
            imagem: 'Imagens_produtos/Guarana_Antartica_2l.jpg',
            disponivel: true
        },
        {
            id: 'fanta-laranja-2l',
            nome: 'Fanta Laranja 2,0 L',
            categoria: 'bebidas',
            precoOriginal: 15.00,
            precoPromocional: 9.00,
            imagem: 'Imagens_produtos/Fanta_Laranja_2l.jpg',
            disponivel: true
        },
        {
            id: 'coca-cola-2l',
            nome: 'Coca-cola 2,0L',
            categoria: 'bebidas',
            precoOriginal: 15.00,
            precoPromocional: 9.00,
            imagem: 'Imagens_produtos/Refrigerante-CocaCola-Pet-2L.png',
            disponivel: true
        },
        
        // Refrigerantes 1L
        {
            id: 'guarana-antarctica-1l',
            nome: 'Guaraná Antarctica 1,0L',
            categoria: 'bebidas',
                          precoOriginal: 12.00,
              precoPromocional: 7.20,
              imagem: 'Imagens_produtos/Guarana_Antarctica_1L.jpg',
              disponivel: false, // Esgotado
              destaque: true
        },
        
        // Refrigerantes 600mL
        {
            id: 'guarana-antarctica-600ml',
            nome: 'Guaraná Antarctica 600mL',
            categoria: 'bebidas',
            precoOriginal: 7.70,
            precoPromocional: 4.62,
            imagem: 'Imagens_produtos/guaranaantartica600ml.jpg',
            disponivel: true
        },
        {
            id: 'fanta-laranja-600ml',
            nome: 'Fanta Laranja 600ml',
            categoria: 'bebidas',
            precoOriginal: 7.70,
            precoPromocional: 4.62,
            imagem: 'Imagens_produtos/FantaLaranja600ml.png',
            disponivel: true
        },
        {
            id: 'coca-cola-600ml',
            nome: 'Coca-cola 600mL',
            categoria: 'bebidas',
            precoOriginal: 7.70,
            precoPromocional: 4.62,
            imagem: 'Imagens_produtos/guaranaantartica600ml.jpg',
            disponivel: true
        },
        {
            id: 'coca-cola-zero-600ml',
            nome: 'Coca-cola (zero) 600mL',
            categoria: 'bebidas',
            precoOriginal: 7.70,
            precoPromocional: 4.62,
            imagem: 'Imagens_produtos/Cocacolazero600ml.jpg',
            disponivel: false // Esgotado
        },
        {
            id: 'guarana-antarctica-zero-600ml',
            nome: 'Guaraná Antártica 600ml zero',
            categoria: 'bebidas',
            precoOriginal: 7.70,
            precoPromocional: 4.62,
            imagem: 'Imagens_produtos/guaranaantartica600mlzero.jpg',
            disponivel: true
        },
        
        // Refrigerantes 350mL (Latas)
        {
            id: 'guarana-antarctica-350ml',
            nome: 'Guaraná Antarctica 350ml',
            categoria: 'bebidas',
            precoOriginal: 6.50,
            precoPromocional: 3.90,
            imagem: 'Imagens_produtos/guaranaantartica350mlzero.jpg',
            disponivel: false, // Esgotado
            destaque: true
        },
        {
            id: 'coca-cola-350ml',
            nome: 'Coca-cola lata 350ml',
            categoria: 'bebidas',
            precoOriginal: 6.50,
            precoPromocional: 3.90,
            imagem: 'Imagens_produtos/Cocacolalata350ml.jpg',
            disponivel: true
        },
        {
            id: 'coca-cola-zero-350ml',
            nome: 'Coca-cola 350mL Zero',
            categoria: 'bebidas',
            precoOriginal: 6.50,
            precoPromocional: 3.90,
            imagem: 'Imagens_produtos/cocacola350mlzero.jpg',
            disponivel: true
        },
        {
            id: 'guarana-antarctica-zero-350ml',
            nome: 'Guaraná Antática 350ml ZERO',
            categoria: 'bebidas',
            precoOriginal: 6.50,
            precoPromocional: 3.90,
            imagem: 'Imagens_produtos/guaranaantartica350mlzero.jpg',
            disponivel: true
        },
        
        // Outras Bebidas
        {
            id: 'guaravita',
            nome: 'Guaravita',
            categoria: 'bebidas',
                          precoOriginal: 2.50,
              precoPromocional: 1.50,
              imagem: 'Imagens_produtos/guaravita.jpg',
              disponivel: true,
              descricao: 'Guaravita (copo) sabor Guaraná'
        },
        {
            id: 'agua-com-gas',
            nome: 'Água com gás',
            categoria: 'bebidas',
                          precoOriginal: 3.50,
              precoPromocional: 2.10,
              imagem: 'Imagens_produtos/aguacomgas.jpg',
              disponivel: true,
              descricao: 'Água com gás 500ml - marca sujeita a alteração'
        },
        {
            id: 'guaraviton-ginseng',
            nome: 'Guaraviton - Sabor Ginseng',
            categoria: 'bebidas',
            precoOriginal: 6.50,
            precoPromocional: 3.90,
            imagem: 'Imagens_produtos/guaraviton.jpg',
            disponivel: true,
            descricao: 'Guaraviton (500mL), sabor Ginseng'
        }
    ],

    // AVULSOS
    avulsos: [
        {
            id: 'kids-burguer-comercial',
            nome: 'Kids Burguer (carne comercial)',
            categoria: 'avulsos',
            precoOriginal: 18.90,
            precoPromocional: 11.34,
            imagem: 'Imagens_produtos/Kids_burguer.jpg',
            disponivel: true,
            descricao: 'Pão tostado, carne comercial (industrializada), mussarela derretida'
        },
        {
            id: 'x-tudo-costela',
            nome: 'X-Tudo Costela',
            categoria: 'avulsos',
            precoOriginal: 31.90,
            precoPromocional: 19.14,
            imagem: 'Imagens_produtos/x_tudo_costela.jpg',
            disponivel: true,
            descricao: 'Pão leve e crocante, burger costela da casa, batata palha, maionese, ovo, mussarela, presunto, cheddar, bacon, alface e tomate fresco'
        },
        {
            id: 'x-bacon-costela',
            nome: 'X-Bacon Costela',
            categoria: 'avulsos',
            precoOriginal: 28.30,
            precoPromocional: 16.98,
            imagem: 'Imagens_produtos/x_bacon_costela.jpg',
            disponivel: true,
            descricao: 'Pão levemente torrado, suculento burger costela da casa, mussarela derretida, presunto e bacon'
        },
        {
            id: 'x-salada-bacon-costela',
            nome: 'X-Salada-Bacon Costela',
            categoria: 'avulsos',
            precoOriginal: 28.90,
            precoPromocional: 17.34,
            imagem: 'Imagens_produtos/x_salada_bacon_costela.jpg',
            disponivel: true,
            descricao: 'Suculento burger costela da casa, pão levemente torrado, batata palha crocante, alface e tomate frescos'
        }
    ]
};

// ===== LOCALIZAÇÃO =====
const LOCALIZACAO_CONFIG = {
    estados: [
        { sigla: 'SP', nome: 'São Paulo' },
        { sigla: 'RJ', nome: 'Rio de Janeiro' },
        { sigla: 'MG', nome: 'Minas Gerais' },
        { sigla: 'RS', nome: 'Rio Grande do Sul' },
        { sigla: 'PR', nome: 'Paraná' },
        { sigla: 'SC', nome: 'Santa Catarina' }
    ],
    cidades: {
        'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto'],
        'RJ': ['Rio de Janeiro', 'Niterói', 'Petrópolis', 'Nova Friburgo'],
        'MG': ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Contagem'],
        'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Santa Maria'],
        'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'],
        'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'Chapecó']
    }
};

// ===== FUNÇÃO PARA ADICIONAR PRODUTOS DINAMICAMENTE =====
function adicionarProdutos(categoria, novosProdutos) {
    if (PRODUTOS_CONFIG[categoria]) {
        PRODUTOS_CONFIG[categoria] = [...PRODUTOS_CONFIG[categoria], ...novosProdutos];
    } else {
        console.warn(`Categoria ${categoria} não encontrada`);
    }
}

// ===== FUNÇÃO PARA SUBSTITUIR PRODUTOS DE UMA CATEGORIA =====
function substituirProdutos(categoria, novosProdutos) {
    if (PRODUTOS_CONFIG[categoria]) {
        PRODUTOS_CONFIG[categoria] = novosProdutos;
    } else {
        console.warn(`Categoria ${categoria} não encontrada`);
    }
}

// ===== FUNÇÃO PARA OBTER TODOS OS PRODUTOS =====
function obterTodosProdutos() {
    return Object.values(PRODUTOS_CONFIG).flat();
}

// ===== FUNÇÃO PARA OBTER PRODUTOS POR CATEGORIA =====
function obterProdutosPorCategoria(categoria) {
    return PRODUTOS_CONFIG[categoria] || [];
}

// ===== RESUMO DA PROMOÇÃO =====
const PROMOCAO_CONFIG = {
    titulo: "MEGA PROMOÇÃO - 40% DE DESCONTO EM TUDO!",
    descricao: "Todos os produtos do Alpha Burguer com 40% de desconto por tempo limitado!",
    desconto: 40,
    validoAte: "Válido até esgotar o estoque ou enquanto durar a promoção",
    destaque: "🔥 IMPERDÍVEL! TODOS OS PRODUTOS COM 40% OFF! 🔥"
};
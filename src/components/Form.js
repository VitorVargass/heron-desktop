import axios from "axios";
import React, { useEffect, useRef, useState, useCallback } from "react";
import styled from "styled-components";
import { toast } from "react-toastify";
import { FaTools, FaTrash } from "react-icons/fa";
import Modal from '../styles/modal-peca.js';
import '../styles/modal.css';

const FormContainter = styled.form`
    width: 82%;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    flex-wrap: wrap;
    background-color: #fff;
    padding: 20px; 
    box-shadow: 0px 0px 5px #ccc;
    border-radius: 5px;
`;

const InputArea = styled.div`
    display: flex;
    flex-direction: column;
`;

const Select = styled.select`
    width:120px;
    padding:0 10px;
    border: 1px solid #bbb;
    border-radius: 5px;
    height: 40px;
`;

const Input = styled.input`
    width:120px;
    padding:0 10px;
    border: 1px solid #bbb;
    border-radius: 5px;
    height: 40px;
`;

const Label = styled.label``;

const Button = styled.button`
    padding:10px;
    cursor: pointer;
    border-radius: 5px;
    border: none;
    background-color: #2c73d2;
    color: white;
    height: 42px;
`;

const Form = ({ getUsers, onEdit, setOnEdit, setTotalPreco }) => {
    const ref = useRef();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pecas, setPecas] = useState([]);
    const [telefone, setTelefone] = useState('');
    const [placa, setPlaca] = useState('');
    const [data, setData] = useState('');
    const [totalPrice, setTotalPrice] = useState('0,00');
    const [maoDeObra, setMaoDeObra] = useState('0,00');

    const API_URL = "http://localhost:8800";

    const calculateTotalPrice = useCallback(() => {
        const total = pecas.reduce((acc, peca) => {
            const price = parseFloat(peca.preco.replace('.', '').replace(',', '.'));
            return acc + (isNaN(price) ? 0 : price);
        }, 0) + parseFloat(maoDeObra.replace('.', '').replace(',', '.'));
        return formatPrice(total);
    }, [pecas, maoDeObra]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const formatPrice = (value) => {
        if (typeof value !== 'string') {
            value = value.toString();
        }
        const number = parseFloat(value.replace(',', '.'));
        if (isNaN(number)) {
            return '0,00';
        }
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
    };


    const handleFormatPrice = (value) => {
        if (typeof value !== 'string') {
            value = value.toString();
        }
        value = value.replace(/[^0-9,]+/g, '');
        value = value.replace(',', '.');
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            value = numericValue.toFixed(2).replace('.', ',');
        } else {
            value = '0,00';
        }
        return formatPrice(value);
    };


    const handleAddPeca = () => {
        const novaPeca = {
            id: Math.random(),
            nome: "",
            quantidade: 1,
            precoUnitario: "0,00",
            preco: "0,00"
        };
        setPecas([...pecas, novaPeca]);
    };

    const handleUpdatePeca = (id, campo, valor) => {
        setPecas(pecas.map(peca => {
            if (peca.id === id) {
                let updatedPeca = { ...peca, [campo]: valor };
                if (campo === 'precoUnitario' || campo === 'quantidade') {
                    updatedPeca.preco = calculateTotal(updatedPeca.precoUnitario, updatedPeca.quantidade);
                }
                return updatedPeca;
            }
            return peca;
        }));
    };

    const calculateTotal = (precoUnitario, quantidade) => {
        const total = parseFloat(precoUnitario.replace('.', '').replace(',', '.')) * quantidade;
        return formatPrice(total);
    };

    const handleBlurPeca = (id, campo, valor) => {
        if (campo === "precoUnitario") {
            valor = handleFormatPrice(valor);
        }
        handleUpdatePeca(id, campo, valor);
    };

    const handleRemovePeca = (id) => {
        setPecas(pecas.filter(peca => peca.id !== id));
    };

    const handleIncrementQuantidade = (id) => {
        handleUpdatePeca(id, "quantidade", pecas.find(peca => peca.id === id).quantidade + 1);
    };

    const handleDecrementQuantidade = (id) => {
        handleUpdatePeca(id, "quantidade", Math.max(pecas.find(peca => peca.id === id).quantidade - 1, 1));
    };

    const handleTelefoneChange = (e) => {
        let value = e.target.value;
        value = value.replace(/\D/g, ''); // Remove tudo que não for dígito
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
        value = value.replace(/(\d)(\d{4})$/, '$1-$2'); // Coloca hífen entre o quarto e o quinto dígitos
        setTelefone(value);
    };

    const handlePlacaChange = (e) => {
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9]/g, ''); // Remove tudo que não for letra ou número
        value = value.replace(/^([A-Z]{3})(\d)/, '$1-$2'); // Coloca hífen entre os três primeiros caracteres e os números
        setPlaca(value);
    };

    const handleDataChange = (e) => {
        let value = e.target.value;
        value = value.replace(/\D/g, ''); // Remove tudo que não for dígito
        value = value.replace(/^(\d{2})(\d)/g, '$1/$2'); // Coloca a primeira barra
        value = value.replace(/(\d{2})(\d)/, '$1/$2'); // Coloca a segunda barra
        setData(value);
    };

    useEffect(() => {
        if (onEdit) {
            const user = ref.current;

            user.cliente.value = onEdit.cliente;
            setTelefone(onEdit.telefone);
            user.marca.value = onEdit.marca;
            user.modelo.value = onEdit.modelo;
            user.ano.value = onEdit.ano;
            setPlaca(onEdit.placa);
            setData(onEdit.data);
            user.status.value = onEdit.status;

            setMaoDeObra(onEdit.maoDeObra);

            if (onEdit.pecas) {
                try {
                    const pecasArray = typeof onEdit.pecas === 'string' ? JSON.parse(onEdit.pecas) : onEdit.pecas;
                    setPecas(pecasArray);
                } catch (error) {
                    console.error("Erro ao parsear pecas:", error);
                    toast.error("Erro ao processar dados das peças.");
                    setPecas([]); // Define um estado seguro padrão
                }
            } else {
                setPecas([]);
            }
        }
    }, [onEdit]);

    useEffect(() => {
        setTotalPrice(calculateTotalPrice());
    }, [pecas, maoDeObra, calculateTotalPrice]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const totalPreco = calculateTotalPrice();
        setTotalPreco(totalPreco);

        const user = ref.current;
        const pecasAsString = JSON.stringify(pecas);
        const isAnyPecaValid = pecas.some(peca => peca.nome.trim() !== "" && peca.quantidade > 0 && parseFloat(peca.preco.replace('.', '').replace(',', '.')) > 0);

        const numeroTelefone = telefone.replace(/\D/g, '');

        if (numeroTelefone.length !== 11) {
            toast.warn("O telefone deve ter 11 dígitos.");
            return;
        }

        if (!user.cliente.value ||
            !user.telefone.value ||
            !user.marca.value ||
            !user.modelo.value ||
            !user.ano.value ||
            !user.placa.value ||
            !user.data.value ||
            !user.status.value ||
            !maoDeObra) {
            return toast.warn("Preencha todos os campos!");
        }
        if (!isAnyPecaValid) {
            toast.warn("Adicione pelo menos uma peça válida.");
            return;
        }

        const dataToSubmit = {
            cliente: user.cliente.value,
            telefone: user.telefone.value,
            marca: user.marca.value,
            modelo: user.modelo.value,
            ano: user.ano.value,
            placa: user.placa.value,
            data: user.data.value,
            status: user.status.value,
            pecas: pecasAsString,
            maoDeObra: maoDeObra,
            totalPreco: totalPreco
        };

        try {
            const response = onEdit
                ? await axios.put(`${API_URL}/${onEdit.id}`, dataToSubmit)
                : await axios.post(`${API_URL}/`, dataToSubmit);

            toast.success("Dados salvos com sucesso!");
            console.log('Resposta da API:', response.data);

            user.cliente.value = "";
            user.telefone.value = "";
            user.marca.value = "";
            user.modelo.value = "";
            user.ano.value = "";
            setPlaca("");
            setData("");
            user.status.value = "";
            setPecas([]);
            setMaoDeObra('0,00');
            setOnEdit(null);
            getUsers();
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            toast.error("Erro ao salvar os dados. Verifique o console para mais detalhes.");
        }
        setTelefone('');
    };

    return (
        <div className="centralizar">
            <FormContainter ref={ref} onSubmit={handleSubmit}>
                <InputArea>
                    <Label>Cliente:</Label>
                    <Input name="cliente" placeholder="Digite o nome" />
                </InputArea>
                <InputArea>
                    <Label>Telefone:</Label>
                    <Input
                        value={telefone}
                        onChange={handleTelefoneChange}
                        placeholder="Digite o telefone"
                        name="telefone"
                    />
                </InputArea>
                <InputArea>
                    <Label>Marca:</Label>
                    <Input name="marca" placeholder="Digite a marca" />
                </InputArea>
                <InputArea>
                    <Label>Modelo/Versão:</Label>
                    <Input name="modelo" placeholder="Digite o modelo" />
                </InputArea>
                <InputArea>
                    <Label>Ano:</Label>
                    <Input name="ano" placeholder="Digite o ano" />
                </InputArea>
                <InputArea>
                    <Label>Placa:</Label>
                    <Input
                        value={placa}
                        onChange={handlePlacaChange}
                        placeholder="Digite a placa"
                        name="placa"
                        type="text"
                    />
                </InputArea>
                <InputArea>
                    <Label>Data:</Label>
                    <Input
                        value={data}
                        onChange={handleDataChange}
                        placeholder="Digite a data"
                        name="data"
                        type="text"
                    />
                </InputArea>
                <InputArea>
                    <Label>Status:</Label>
                    <Select name="status" >
                        <option disabled>Selecione</option>
                        <option>Finalizado</option>
                        <option>Na oficina</option>
                        <option>Aguardando Prorietário</option>
                    </Select>
                </InputArea>
                <Button type="button" onClick={handleOpenModal} name="pecas"><FaTools /></Button>
                <Button type="submit">SALVAR</Button>
            </FormContainter>
            {isModalOpen && (
                <Modal>
                    <div className="modal-peca">
                        {pecas.map(peca => (
                            <div key={peca.id}>
                                <input
                                    type="text"
                                    value={peca.nome}
                                    onChange={(e) => handleUpdatePeca(peca.id, "nome", e.target.value)}
                                    placeholder="Digite o Nome da peça"
                                    className="input-peca"
                                />
                                <input
                                    type="text"
                                    value={peca.precoUnitario}
                                    onChange={(e) => handleUpdatePeca(peca.id, "precoUnitario", e.target.value)}
                                    onBlur={(e) => handleBlurPeca(peca.id, "precoUnitario", e.target.value)}
                                    placeholder="Digite o preco da peça"
                                    className="input-peca"
                                />
                                <span className="price-display">{peca.preco}</span>
                                <button onClick={() => handleDecrementQuantidade(peca.id)} className="buttons-quant">-</button>
                                <span className="number">{peca.quantidade}</span>
                                <button onClick={() => handleIncrementQuantidade(peca.id)} className="buttons-quant">+</button>
                                <span onClick={() => handleRemovePeca(peca.id)} className="buttons-del"><FaTrash /></span>
                            </div>
                        ))}
                        <div>
                            <label>Mão de Obra:</label>
                            <input
                                type="text"
                                value={maoDeObra}
                                name="maoDeObra"
                                onChange={(e) => setMaoDeObra(e.target.value)}
                                onBlur={(e) => setMaoDeObra(handleFormatPrice(e.target.value))}
                                placeholder="Digite o valor da mão de obra"
                                className="input-peca"
                            />
                        </div>
                        <div className="buttons-low">
                            <button onClick={handleAddPeca} className="add-button">Adicionar Peça</button>
                            <button className="add-button" onClick={handleCloseModal} >Concluir</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Form;

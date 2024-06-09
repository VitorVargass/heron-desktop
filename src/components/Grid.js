import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";
import { FaTrash, FaEdit, FaTools, FaRegWindowClose } from "react-icons/fa";
import { toast } from "react-toastify";
import jsPDF from 'jspdf';
import Modal from 'react-modal';
import '../styles/modal.css';
import '../styles/modal-peca.js';

const SearchBarContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #f3f3f3;
  padding: 8px 10px;
  border: solid black 2px;
  border-radius: 20px;
  margin: 20px;
`;

const SearchInput = styled.input`
  border: none;
  background-color: transparent;
  outline: none;
  padding: 8px;
  width: 100%;
  margin-right: 10px;

  ::placeholder {
    color: #ccc;
  }
`;

const Table = styled.table`
    width: 85%;
    background-color: #fff;
    padding: 20px;
    box-shadow: 0px 0px 5px #ccc;
    border-radius: 5px;
    margin: 20px 0px;
    word-break: break-word;
    table-layout: fixed;
`;

export const Thead = styled.thead``;

export const Tbody = styled.tbody``;

export const Tr = styled.tr``;

export const Th = styled.th`
    text-align: start;
    border-bottom: inset;
    padding-bottom: 5px;
    width: ${(props) => props.width || 'auto'};
`;

export const Td = styled.td`
    padding-top: 15px;
    text-align: ${((props) => (props.$alignCenter ? "center" : "start"))};
    width: ${(props) => (props.width ? props.width : "auto")};
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;

    @media (max-width: 500px) {
        ${(props) => props.$onlyWeb && "display:none"}
    }
`;

// Icones do Grid //

const EditIcon = styled(FaEdit)`
  font-size: 20px;
  cursor: pointer;
  &:hover {
    color: green;
  }
`;


const DeleteIcon = styled(FaTrash)`
  font-size: 20px;
  cursor: pointer;
  &:hover {
    color: red;
  }
`;


const ToolsIcon = styled(FaTools)`
  font-size: 20px;
  cursor: pointer;
  &:hover {
    color: #2c73d2;
  }
`;

// Tabela do Modal  de pecas //

const TableWrapper = styled.div`
  border: 1px solid #ccc;
  overflow-x: auto;
  height: 400px;
`;

const StyledTable = styled.table`
  width: 100%;
  height: 350px;
  table-layout: fixed;
`;

const StyledThead = styled.thead`
 display: table;
 width: 100%;
 table-layout: fixed;
`;

const StyledTh = styled.th`
  text-align: center;
  padding: 8px;
  border-bottom: 1px solid black;
  font-weight: normal;
`;

const ScrollableTbody = styled.tbody`
  display: block;
  max-height: 350px; /* ou qualquer que seja a altura desejada */
  overflow-y: auto;
  overflow-x: hidden;
`;

const StyledTd = styled.td`
  text-align: center;
  padding: 8px;
  border-bottom: 1px solid #ddd;
  width: 100%;
`;

const StyledTr = styled.tr`
    display: table;
  width: 100%;
  table-layout: fixed;
  &:nth-child(even) {
    background-color: #f9f9f9;
  }

  &:hover {
    background-color: #f1f1f1;
  }
`;


const ConfirmationModal = ({ isOpen, onClose, onConfirm, itemToDelete}) => (
    <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Confirmação de Exclusão"
        overlayClassName="modal-confirmacao-overlay"
        className="modal-confirmacao"
    >
        <h2>Confirmação de Exclusão</h2>
        <p>Tem certeza de que deseja excluir "{itemToDelete?.cliente}" ?</p>
        <div>
            <button className="modal-confirmacao-button-delete" onClick={onConfirm}>Sim, excluir</button>
            <button className="modal-confirmacao-button" onClick={onClose}>Cancelar</button>
        </div>
    </Modal>
);

const ConfirmationModalEdit = ({ isOpen, onClose, onConfirm, itemToEdit}) => (
    <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Confirmação de Edição"
        overlayClassName="modal-confirmacao-overlay"
        className="modal-confirmacao"
    >
        <h2>Confirmação de Edição</h2>
        <p>Tem certeza de que deseja editar "{itemToEdit?.cliente}" ?</p>
        <div>
            <button className="modal-confirmacao-button-edit" onClick={onConfirm}>Sim, editar</button>
            <button className="modal-confirmacao-button" onClick={onClose}>Cancelar</button>
        </div>
    </Modal>
);

const Grid = ({ users, setUsers, setOnEdit, totalPreco}) => {

    // Verificação de segurança para garantir que `users` não seja undefined
  if (!users) {
    console.error("Erro: `users` está indefinido, verifique conexão com backend!");
    users = [];
  }

    const [modalIsOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalEditOpen, setConfirmModalEditOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);

    const API_URL = "http://localhost:8800";

    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const filteredUsers = searchQuery.length > 0
    ? users.filter((user) => user.cliente.toLowerCase().includes(searchQuery))
    : users;

    // Abre Modal de Pecas do Grid
    function openModal(item) {
        setIsOpen(true);
        setSelectedItem(item);
    }
    // Fecha Modal de Pecas do Grid
    function closeModal() {
        setIsOpen(false);
        setSelectedItem(null);
    }
    //Abre Modal de Confirmação-excluir
    const openConfirmModal = (item) => {
        setItemToDelete(item);
        setConfirmModalOpen(true);
    };
    //Fecha Modal de Confirmação-excluir
    const closeConfirmModal = () => {
        setConfirmModalOpen(false);
        setItemToDelete(null);
    };
    // Funcao para confirmar exclusao
    const handleDeleteConfirmed = async () => {
        if (itemToDelete) {
            await handleDelete(itemToDelete.id);
            closeConfirmModal();
        }
    };
    // Abre modal confirmar para editar
    const openConfirmModalEdit = (item) => {
        setItemToEdit(item);
        setConfirmModalEditOpen(true);
    };
    //Fecha Modal confirmar para editar
    const closeConfirmModalEdit = () => {
        setConfirmModalEditOpen(false);
        setItemToEdit(null);
    };

    const handleEditConfirmed = async () => {
        if (itemToEdit) {
            handleEdit(itemToEdit);
            closeConfirmModalEdit();
        }
    };
    // Funcao de editar
    const handleEdit = (item) => {
        setOnEdit(item);
        //setIsEditing(true);
        toast.info(`Item selecionado: ${item.cliente}`);
    };

    
    const handleDelete = async (id) => {
        try {
            const { data } = await axios.delete(`${API_URL}/${id}`);
            //const { data } = await axios.delete(`http://localhost:8800/${id}`);
            const newArray = users.filter((user) => user.id !== id);
            setUsers(newArray);
            toast.success(data);
        } catch (error) {
            if (error.response) {
                // O servidor respondeu com um status fora do intervalo 2xx
                console.error("Data:", error.response.data);
                console.error("Status:", error.response.status);
                console.error("Headers:", error.response.headers);
                const errorMessage = error.response.data && error.response.data.message
                    ? error.response.data.message
                    : "Erro ao deletar o registro.";
                toast.error(errorMessage);
            } else if (error.request) {
                // O pedido foi feito, mas não houve resposta
                console.error("No response:", error.request);
                toast.error("Nenhuma resposta do servidor ao tentar deletar.");
            } else {
                // Algo aconteceu na configuração do pedido que disparou um Erro
                console.error("Error:", error.message);
                toast.error("Erro ao tentar deletar: " + error.message);
            }
        }

        setOnEdit(null);
    };

    const formatPecasTable = (pecasString) => {
        let pecasArray;

        pecasArray = JSON.parse(pecasString);


        // Se pecasArray é definido e é um array, então mapeia os itens para a tabela
        if (pecasArray && Array.isArray(pecasArray)) {
            return (
                <TableWrapper>
                    <StyledTable>
                        <StyledThead>
                            <tr>
                                <StyledTh>Produto</StyledTh>
                                <StyledTh>Quantidade</StyledTh>
                                <StyledTh>Preco</StyledTh>
                            </tr>
                        </StyledThead>
                        <ScrollableTbody>
                            {pecasArray.map((peca, index) => (
                                <StyledTr key={index}>
                                    <StyledTd>{peca.nome}</StyledTd>
                                    <StyledTd>{peca.quantidade}</StyledTd>
                                    <StyledTd>{peca.preco}</StyledTd>
                                </StyledTr>
                            ))}
                        </ScrollableTbody>
                    </StyledTable>
                </TableWrapper>
            );
        } else {
            // Retorna alguma UI para mostrar que pecasArray não é uma array
            return <p>Dados das peças não estão no formato de array.</p>;
        }
    };

    //PDF generator 

    const generatePDF = () => {
        const doc = new jsPDF();
    
        // Configurando o título
        doc.setFontSize(20);
        doc.text('Ordem de Serviço', 105, 20, null, null, 'center');
    
        // Adicionando informações do cliente
        doc.setFontSize(12);
        doc.text(`Cliente: ${selectedItem.cliente}`, 20, 30);
        doc.text(`Telefone: ${selectedItem.telefone}`, 20, 40);
        doc.text(`Marca: ${selectedItem.marca}`, 20, 50);
        doc.text(`Modelo: ${selectedItem.modelo}`, 20, 60);
        doc.text(`Ano: ${selectedItem.ano}`, 20, 70);
        doc.text(`Placa: ${selectedItem.placa}`, 20, 80);
        doc.text(`Data: ${selectedItem.data}`, 20, 90);
        doc.text(`Status: ${selectedItem.status}`, 20, 100);
    
        // Adicionar uma linha divisória
        doc.setDrawColor(0);
        doc.setFillColor(192, 192, 192);
        doc.rect(20, 105, 170, 0.5, 'F');
    
        // Adicionar cabeçalho da tabela de peças
        doc.text('Produto', 20, 115);
        doc.text('Quantidade', 90, 115);
        doc.text('Preço', 160, 115);
    


        let pecasArray = selectedItem.pecas;

        // Verifica se pecasArray é uma string e tenta parsear para JSON
        if (typeof pecasArray === 'string') {
            try {
                pecasArray = JSON.parse(pecasArray);
            } catch (error) {
                console.error("Erro ao parsear peças:", error);
                toast.error("Erro ao processar dados das peças.");
                return;
            }
        }

         // Agora usa pecasArray como um array
         if (Array.isArray(pecasArray)) {
            let y = 125;
            pecasArray.forEach(peca => {
                let precoFormatted = peca.preco;
    
                // Checa se preco é uma string e tenta converter para número
                if (typeof precoFormatted === 'string') {
                    precoFormatted = parseFloat(precoFormatted);
                }
    
                // Só tenta usar toFixed se precoFormatted for um número
                if (typeof precoFormatted === 'number') {
                    doc.text(peca.nome, 20, y);
                    doc.text(`${peca.quantidade}`, 90, y);
                    doc.text(`R$ ${precoFormatted.toFixed(2)}`, 160, y);
                    y += 10;
                } else {
                    console.error("Preço não é um número:", precoFormatted);
                    toast.error("Erro ao formatar preço.");
                }
            });
            doc.save(`${selectedItem.cliente}.pdf`);
        } else {
            console.error("Peças não estão em formato de array");
            toast.error("Dados das peças não estão no formato correto.");
        }

        return doc;
    };

    //IMPRIMIR PDF 

     const printPDF = () => {
         const doc = generatePDF(); // Esta função retorna a instância jsPDF
    
         if (doc) {
            // Gera o PDF como um Blob
            const pdfBlob = doc.output('blob');
    
            // Cria um URL para o Blob
            const blobUrl = URL.createObjectURL(pdfBlob);
    
            // Abre uma nova janela e carrega o PDF para impressão
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`<iframe src="${blobUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`);
                
                // Aguarda o carregamento da nova janela e dispara a impressão
                printWindow.onload = function() {
                    printWindow.print();
                };
            } else {
                console.error('Failed to open print window.');
            }
        } else {
            console.error('Failed to generate PDF document.');
        }
     }



    return (

    <div className="centralizar-grid">
        <SearchBarContainer>
        <SearchInput
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Buscar por Cliente..."
        />
      </SearchBarContainer>

      
            <Table>
                <Thead>
                    <Tr>
                        <Th width="20%">Cliente</Th>
                        <Th width="15%">Telefone</Th>
                        <Th width="15%">Marca</Th>
                        <Th width="15%" $onlyWeb>Modelo/Versão</Th>
                        <Th width="10%">Ano</Th>
                        <Th width="10%">Placa</Th>
                        <Th width="10%">Data</Th>
                        <Th width="10%">Preco</Th>
                        <Th width="10%">Status</Th>
                        <Th width="5%"></Th>
                        <Th width="5%"></Th>
                        <Th width="5%"></Th>
                    </Tr>
                </Thead>
                <Tbody>

                    {filteredUsers.map((item, i) => (
                        <Tr key={i}>
                            <Td width="20%">{item.cliente}</Td>
                            <Td width="15%" pattern="^\\+?\\d{1,3}\\s?\\(?\\d{2,3}\\)?\\s?\\d{3,4}[-\\s]?\\d{4}$">{item.telefone}</Td>
                            <Td width="15%">{item.marca}</Td>
                            <Td width="15%">{item.modelo}</Td>
                            <Td width="10%">{item.ano}</Td>
                            <Td width="10%">{item.data}</Td>
                            <Td width="10%">{item.placa}</Td>
                            <Td width="10%">{item.totalPreco}</Td>
                            <Td width="15%">{item.status}</Td>
                            <Td width="5%" $alignCenter >
                                <EditIcon onClick={() => openConfirmModalEdit(item)} />
                            </Td>
                            <Td width="5%" $alignCenter >
                                <DeleteIcon onClick={() => openConfirmModal(item)} />
                            </Td>
                            <Td width="5%" $alignCenter>
                                <ToolsIcon onClick={() => openModal(item)} />
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table> 
            
            
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Detalhes do Item"

                overlayClassName="modal-overlay"
                className="modal-content"
            >
                <div>
                    <h2>Detalhes do Cliente</h2>
                    <span onClick={closeModal} ><FaRegWindowClose /></span>
                </div>
                {selectedItem && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: '1' }}>
                            <ul>
                                <li className="info-modal">Cliente: {selectedItem.cliente}</li>
                                <li className="info-modal">Telefone: {selectedItem.telefone}</li>
                                <li className="info-modal">Marca: {selectedItem.marca}</li>
                                <li className="info-modal">Modelo: {selectedItem.modelo}</li>
                                <li className="info-modal">Ano: {selectedItem.ano}</li>
                                <li className="info-modal">Placa: {selectedItem.placa}</li>
                                <li className="info-modal">Data: {selectedItem.data}</li>
                                <li className="info-modal">Status: {selectedItem.status}</li>
                                <li className="info-modal">Mão de Obra: {selectedItem.maoDeObra}</li>
                                <li className="info-modal">Custo de pecas: { (selectedItem.totalPreco - selectedItem.maoDeObra).toFixed(2) }</li>
                                <li className="info-modal">Total: {selectedItem.totalPreco}</li>
                            </ul>
                        </div>
                        
                        <div style={{ flex: '1', flexDirection: 'column', justifyContent: 'center' }}>
                            {formatPecasTable(selectedItem.pecas)}
                            <button className="btn-impressao"onClick={generatePDF}>Fazer Dowload de Ordem de Serviço</button>
                            <button className="btn-impressao"onClick={printPDF}>Imprimir Ordem de Serviço</button>
                        </div>
                        
                    </div>
                    
                )}

            </Modal>
            
            
            <ConfirmationModal isOpen={confirmModalOpen} onClose={closeConfirmModal} onConfirm={handleDeleteConfirmed} itemToDelete={itemToDelete} />
            <ConfirmationModalEdit isOpen={confirmModalEditOpen} onClose={closeConfirmModalEdit} onConfirm={handleEditConfirmed} itemToEdit={itemToEdit} />
        </div>
    );

};

export default Grid;
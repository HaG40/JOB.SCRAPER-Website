import { useState, useContext } from "react";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import ContactBox from "./ContactBox";
import { UserContext } from "../../App";

const allContactTypes = ["email", "tel", "line", "instagram", "facebook", "linkedin"];

function CreatePost() {


    const [type, setType] = useState("find");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [salary, setSalary] = useState("");
    const [contractor, setContractor] = useState("");
    const [pay, setPay] = useState("");
    const [location, setLocation] = useState("");

    const [contacts, setContacts] = useState([{ type: "email", value: "" }]);
    const { user } = useContext(UserContext);

    const handleAddContact = () => {
        const usedTypes = contacts.map(c => c.type);
        const available = allContactTypes.filter(t => !usedTypes.includes(t));
        if (available.length > 0) {
            setContacts([...contacts, { type: available[0], value: "" }]);
        }
    };

    const handleContactChange = (index, field, newValue) => {
        const updated = [...contacts];
        updated[index][field] = newValue;
        setContacts(updated);
    };

    const handleRemoveContact = (index) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const HandleSubmit = (e) => {
        e.preventDefault();

        const contactObj = contacts.reduce((acc, curr) => {
            if (curr.value.trim() !== "") { // only add if value not empty
            acc[curr.type] = curr.value;
            }
            return acc;
        }, {});

        const payload = {
            title,
            description,
            type,
            posted_by_id: user.id, 
            companyName,
            salary,
            contractor,
            pay,
            location,
            ...contactObj,  
        };

        fetch(`http://localhost:8888/api/jobs/post/${type}`, {
            credentials: "include",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(res => {
            if (!res.ok) {
                console.log("Failed Posting", res.status, res.statusText);
                return res.text().then(text => { throw new Error(text) });
            } else {
                console.log("Posted successfully");
                window.location.replace("/post");
            }
            })
            .catch(err => {
            console.error("Error posting:", err.message);
            });
        };

    return (
        <>
            <div className='p-4 max-w-3xl mx-auto'>
                <h1 className="text-2xl font-bold text-orange-600 ml-4">เขียนโพสต์</h1>
                <div className="mt-4 border border-gray-300 rounded p-4">
                    <form onSubmit={HandleSubmit} className="space-y-4 flex flex-col">

                        <label className="text-xl text-orange-500 mb-2 font-medium">หัวข้อ :</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="border p-1 rounded w-full mb-2 shadow border-gray-300"
                            placeholder="กำลังมองหา..."
                        />

                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="border p-1 rounded w-full mb-4 shadow border-gray-300 text-gray-500"
                        >
                            <option value="find">หางาน</option>
                            <option value="recruit">จ้างงาน</option>
                            <option value="contract">ฟรีแลนซ์</option>
                        </select>

                        <label className="text-xl text-orange-500 mb-1 font-medium">เนื้อหา :</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="border p-2 rounded w-full mb-2 h-75 shadow border-gray-300 resize-none"
                            placeholder="เขียนรายละเอียดเกี่ยวกับงาน ความสามารถ เงินเดือน"
                        />

                        {type === "recruit" && (
                            <>
                                <label className="text-xl text-orange-500 mb-1 font-medium">บริษัท :</label>
                                <input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="border p-1 rounded w-full mb-1 shadow border-gray-300"
                                />

                                <label className="text-xl text-orange-500 mb-1 font-medium">สถานที่ :</label>
                                <input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="border p-1 rounded w-full mb-2 shadow border-gray-300"
                                />

                                <label className="text-xl text-orange-500 mb-1 font-medium">เงินเดือน :</label>
                                <input
                                    value={salary}
                                    onChange={(e) => setSalary(e.target.value)}
                                    className="border p-1 rounded w-full mb-4 shadow border-gray-300"
                                />
                            </>
                        )}

                        {type === "contract" && (
                            <>
                                <label className="text-xl text-orange-500 mb-1 font-medium">ผู้ว่าจ้าง :</label>
                                <input
                                    value={contractor}
                                    onChange={(e) => setContractor(e.target.value)}
                                    className="border p-1 rounded w-full mb-1 shadow border-gray-300"
                                />

                                <label className="text-xl text-orange-500 mb-1 font-medium">สถานที่ :</label>
                                <input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="border p-1 rounded w-full mb-2 shadow border-gray-300"
                                />

                                <label className="text-xl text-orange-500 mb-1 font-medium">ค่าจ้าง :</label>
                                <input
                                    value={pay}
                                    onChange={(e) => setPay(e.target.value)}
                                    className="border p-1 rounded w-full mb-4 shadow border-gray-300"
                                />
                            </>
                        )}

                        <div className="flex flex-row justify-between items-center">
                            <label className="text-xl text-orange-500 font-medium">ช่องทางการติดต่อ :</label>
                            <button
                                onClick={handleAddContact}
                                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 cursor-pointer shadow"
                                type="button"
                            >
                                <FaPlus />
                            </button>
                        </div>

                        {contacts.map((contact, index) => {
                            const usedTypes = contacts.map(c => c.type);
                            const availableTypes = allContactTypes.filter(
                                t => t === contact.type || !usedTypes.includes(t)
                            );

                            return (
                                <ContactBox
                                    key={index}
                                    contact={contact}
                                    availableTypes={availableTypes}
                                    onChange={(field, value) => handleContactChange(index, field, value)}
                                    onRemove={() => handleRemoveContact(index)}
                                    canRemove={contacts.length > 1}
                                />
                            );
                        })}

                        <button
                            type='submit'
                            className='bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 shadow cursor-pointer'
                        >
                            โพสต์
                        </button>
                    </form>
                </div>
            </div>

            <div className="fixed bottom-10 right-15">
                <Link
                    to='/post'
                    className="w-16 h-16 bg-orange-500 text-white text-3xl font-semibold rounded-full hover:bg-orange-600 shadow flex items-center justify-center"
                >
                    <FaArrowLeft />
                </Link>
            </div>
        </>
    );
}

export default CreatePost;

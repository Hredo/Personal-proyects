<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('cines', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('localidad');
            $table->string('direccion');
            $table->integer('cantidad_salas');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('cines');
        Schema::enableForeignKeyConstraints();
    }
};
